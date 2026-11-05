import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { API, db, err } from '../test/handlers';
import { server } from '../test/server';
import { logIn, logOut } from './auth';
import { ApiError, isApiError, request } from './client';
import { getMe } from './users';

const paths = () => db.requests.map((r) => `${r.method} ${r.path}`);
const unauth = () => err(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
const caught = (p: Promise<unknown>) =>
  p.then(
    () => undefined,
    (e: unknown) => e as ApiError,
  );

afterEach(() => vi.restoreAllMocks());

describe('기본 요청 (LP-08)', () => {
  it('모든 요청에 credentials: include, 바디가 있으면 JSON으로 보낸다', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await getMe();
    await logIn({ email: 'hong@example.com', password: 'password123' });
    expect(spy).toHaveBeenCalledTimes(2);
    for (const [, init] of spy.mock.calls) expect(init?.credentials).toBe('include');
    const [url, init] = spy.mock.calls[1];
    expect(url).toBe(`${API}/auth/login`);
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'hong@example.com',
      password: 'password123',
    });
  });

  it('JSON 응답을 돌려주고 204는 undefined로 처리한다', async () => {
    await expect(getMe()).resolves.toEqual(db.user);
    await expect(logOut()).resolves.toBeUndefined();
  });

  it('쿼리 파라미터에서 빈 값은 뺀다', async () => {
    server.use(
      http.get(`${API}/echo`, ({ request: r }) => HttpResponse.json(new URL(r.url).search)),
    );
    await expect(
      request('/echo', { query: { a: 1, b: undefined, c: null, d: '', e: 'x' } }),
    ).resolves.toBe('?a=1&e=x');
    await expect(request('/echo')).resolves.toBe('');
  });
});

describe('오류 변환 (NP-15, LP-08)', () => {
  it('NP-15 형식 오류를 ApiError{status, code, message, fields}로 바꾼다', async () => {
    server.use(
      http.post(`${API}/categories`, () =>
        err(409, 'CATEGORY_NAME_DUPLICATE', '중복', { name: '이미 있습니다.' }),
      ),
    );
    const e = await caught(request('/categories', { method: 'POST', body: { name: 'a' } }));
    expect(isApiError(e)).toBe(true);
    expect(e).toMatchObject({
      status: 409,
      code: 'CATEGORY_NAME_DUPLICATE',
      message: '중복',
      fields: { name: '이미 있습니다.' },
    });
  });

  it('형식이 아닌 오류 본문은 UNKNOWN_ERROR로 바꾼다', async () => {
    server.use(http.get(`${API}/users/me`, () => new HttpResponse('boom', { status: 502 })));
    expect(await caught(getMe())).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
  });

  it('네트워크 실패도 ApiError(status 0)로 던진다', async () => {
    server.use(http.get(`${API}/users/me`, () => HttpResponse.error()));
    const e = await caught(getMe());
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect(isApiError(new Error('x'))).toBe(false);
  });
});

describe('401 갱신·재시도 (LP-08, LP-09, SN-15)', () => {
  it('401 UNAUTHENTICATED이면 갱신 1회 후 원래 요청을 1회 재시도해 그 응답을 돌려준다', async () => {
    server.use(http.get(`${API}/users/me`, unauth, { once: true }));
    await expect(getMe()).resolves.toEqual(db.user);
    expect(paths()).toEqual(['POST /auth/refresh', 'GET /users/me']); // 첫 401은 once 핸들러가 받음
  });

  it('동시 401 3개에도 갱신은 1회(single-flight), 3개 모두 재시도되고 이후 새 401은 다시 갱신한다', async () => {
    let refreshed = false;
    let refreshCalls = 0;
    let meCalls = 0;
    server.use(
      http.post(`${API}/auth/refresh`, async () => {
        refreshCalls += 1;
        await delay(100);
        refreshed = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${API}/users/me`, () => {
        meCalls += 1;
        return refreshed ? HttpResponse.json(db.user) : unauth();
      }),
    );
    await expect(Promise.all([getMe(), getMe(), getMe()])).resolves.toEqual([
      db.user,
      db.user,
      db.user,
    ]);
    expect(refreshCalls).toBe(1);
    expect(meCalls).toBe(6);

    refreshed = false;
    await expect(getMe()).resolves.toEqual(db.user);
    expect(refreshCalls).toBe(2);
  });

  it('/auth/* 의 401은 갱신 없이 그대로 던진다(로그인 실패, 갱신 자체의 401)', async () => {
    const e = await caught(logIn({ email: 'hong@example.com', password: 'wrong-pass' }));
    expect(e).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    db.isLoggedIn = false;
    const r = await caught(request('/auth/refresh', { method: 'POST' }));
    expect(r).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(paths()).toEqual(['POST /auth/login', 'POST /auth/refresh']);
  });

  it('UNAUTHENTICATED가 아닌 401은 갱신하지 않는다', async () => {
    server.use(http.get(`${API}/users/me`, () => err(401, 'OTHER', 'x')));
    expect(await caught(getMe())).toMatchObject({ status: 401, code: 'OTHER' });
    expect(paths()).toEqual([]);
  });

  it('갱신이 실패하면 재시도 없이 원래 401을 던진다', async () => {
    db.isLoggedIn = false;
    const e = await caught(getMe());
    expect(e).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(paths()).toEqual(['GET /users/me', 'POST /auth/refresh']);
  });

  it('갱신 요청이 네트워크 실패여도 원래 401을 던진다', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.error()));
    db.isLoggedIn = false;
    expect(await caught(getMe())).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('재시도가 다시 401이면 추가 갱신 없이 그 401을 던진다', async () => {
    let meCalls = 0;
    server.use(
      http.get(`${API}/users/me`, () => {
        meCalls += 1;
        return unauth();
      }),
    );
    expect(await caught(getMe())).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(meCalls).toBe(2);
    expect(paths()).toEqual(['POST /auth/refresh']);
  });
});

describe('fetch 사용 위치 (LP-08)', () => {
  it('fetch는 api/client.ts 밖에서 쓰이지 않는다', () => {
    const src = path.resolve(import.meta.dirname, '..');
    const offenders = readdirSync(src, { recursive: true, encoding: 'utf8' })
      .map((f) => f.split(path.sep).join('/'))
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.startsWith('test/'))
      .filter((f) => f !== 'api/client.ts')
      .filter((f) => /\bfetch\s*\(/.test(readFileSync(path.join(src, f), 'utf8')));
    expect(offenders).toEqual([]);
    expect(readFileSync(path.join(src, 'api/client.ts'), 'utf8')).toMatch(/\bfetch\s*\(/);
  });
});
