import request from 'supertest';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';

const ORIGIN = 'http://localhost:5173';
const app = createApp();

afterEach(() => vi.restoreAllMocks());
afterAll(() => pool.end());

describe('GET /api/health (SP-12)', () => {
  it('쿠키 없이 200 {status:ok}', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('DB 실패 시 503 SERVICE_UNAVAILABLE', async () => {
    vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('x-powered-by 헤더 없음 (SP-07)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS (NFR-10)', () => {
  it('허용 출처는 credentials true', async () => {
    const res = await request(app).get('/api/health').set('Origin', ORIGIN);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('다른 출처에는 ACAO 없음', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('FRONTEND_ORIGIN에 쉼표로 지정한 출처를 각각 허용', async () => {
    vi.stubEnv('FRONTEND_ORIGIN', `${ORIGIN},https://app.example.com`);
    const multi = createApp();
    vi.unstubAllEnvs();
    for (const origin of [ORIGIN, 'https://app.example.com']) {
      const res = await request(multi).get('/api/health').set('Origin', origin);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
    }
  });
});

describe('공통 오류 응답 (D-10, NP-15)', () => {
  it('미등록 경로 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('잘못된 JSON 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toEqual(expect.any(String));
  });

  it('100kb 초과 본문 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/nope')
      .send({ a: 'x'.repeat(110 * 1024) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Swagger UI /api/docs (개발 환경 전용)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('development에서는 문서 화면과 명세를 제공한다', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const dev = createApp();
    const page = await request(dev).get('/api/docs/');
    expect(page.status).toBe(200);
    expect(page.text).toContain('swagger-ui');
    const init = await request(dev).get('/api/docs/swagger-ui-init.js');
    expect(init.text).toContain('/api/health');
  });

  it.each(['test', 'production'])('%s에서는 404', async (env) => {
    vi.stubEnv('NODE_ENV', env);
    const res = await request(createApp()).get('/api/docs/');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
