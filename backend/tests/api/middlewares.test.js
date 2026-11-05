import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError } from '../../src/lib/errors.js';
import { logger } from '../../src/lib/logger.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { validate } from '../../src/middlewares/validate.js';
import { idParams, todaySchema } from '../../src/validators/common.schemas.js';

afterEach(() => vi.restoreAllMocks());

function makeApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/v',
    validate({ body: z.object({ title: z.string().min(1), n: z.number() }) }),
    (req, res) => res.json(req.body),
  );
  app.get('/items/:id', validate({ params: idParams }), (req, res) => res.json(req.params));
  app.get('/q', validate({ query: todaySchema }), (req, res) => res.json(req.query));
  app.get('/app-error', () => {
    throw new AppError(409, 'CONFLICT', '충돌');
  });
  app.get('/app-error-fields', () => {
    throw new AppError(400, 'VALIDATION_ERROR', '잘못됨', { a: 'bad' });
  });
  app.post('/boom', () => {
    throw new Error('secret internal detail');
  });
  app.use(errorHandler);
  return app;
}

describe('validate (LP-05, FR-13)', () => {
  it('실패 시 400 VALIDATION_ERROR + fields', async () => {
    const res = await request(makeApp()).post('/v').send({ n: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['n', 'title']);
    expect(typeof res.body.error.fields.title).toBe('string');
  });

  it('통과 시 알 수 없는 필드(userId) 제거', async () => {
    const res = await request(makeApp()).post('/v').send({ title: 't', n: 1, userId: 99 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ title: 't', n: 1 });
  });

  it('params 파싱 결과(Number) 반영, 형식 오류는 404 NOT_FOUND (D-10)', async () => {
    const app = makeApp();
    expect((await request(app).get('/items/5')).body).toEqual({ id: 5 });
    for (const bad of ['abc', '0', '01', '2147483648']) {
      const res = await request(app).get(`/items/${bad}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
  });

  it('query 통과 시 파싱 결과로 교체(알 수 없는 키 제거), 실패 시 400 fields.today', async () => {
    const app = makeApp();
    const ok = await request(app).get('/q?today=2026-11-04&extra=1');
    expect(ok.body).toEqual({ today: '2026-11-04' });
    const bad = await request(app).get('/q?today=2026-02-30');
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields)).toEqual(['today']);
  });

  it('본문 자체가 객체가 아니면 400, fields 키는 _', async () => {
    const res = await request(makeApp()).post('/v').send([1]);
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual(['_']);
  });
});

describe('errorHandler (NP-15, NFR-12)', () => {
  it('AppError는 해당 status·code·message', async () => {
    const res = await request(makeApp()).get('/app-error');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'CONFLICT', message: '충돌' } });
  });

  it('AppError fields 포함', async () => {
    const res = await request(makeApp()).get('/app-error-fields');
    expect(res.body.error.fields).toEqual({ a: 'bad' });
  });

  it('알 수 없는 예외는 500, 스택·내부 메시지 없음, 민감값 로그 미포함', async () => {
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const res = await request(makeApp())
      .post('/boom')
      .send({ password: 'PwSecret123', refreshToken: 'TokSecret456' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
    });
    expect(res.text).not.toMatch(/secret internal detail|at .*\.js/);

    expect(spy).toHaveBeenCalledTimes(1);
    const args = spy.mock.calls[0];
    expect(args[0].path).toBe('/boom');
    expect(args[0].time).toBeDefined();
    const dump = JSON.stringify(args);
    expect(dump).not.toContain('PwSecret123');
    expect(dump).not.toContain('TokSecret456');
  });

  it('4xx(AppError)는 error 로그를 남기지 않는다', async () => {
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    await request(makeApp()).get('/app-error');
    expect(spy).not.toHaveBeenCalled();
  });

  it('잘못된 JSON·100kb 초과는 400 VALIDATION_ERROR', async () => {
    const app = makeApp();
    const bad = await request(app).post('/v').set('Content-Type', 'application/json').send('{bad');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    // 이 테스트 앱의 express.json() 기본 limit도 100kb
    const big = await request(app)
      .post('/v')
      .send({ title: 'a'.repeat(110 * 1024), n: 1 });
    expect(big.status).toBe(400);
    expect(big.body.error.code).toBe('VALIDATION_ERROR');
  });
});
