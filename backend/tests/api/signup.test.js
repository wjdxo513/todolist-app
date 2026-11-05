import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';

afterAll(() => pool.end());

const app = createApp();
const valid = { email: 'a@example.com', password: 'password123', name: '홍길동' };
const post = (body) => request(app).post('/api/auth/signup').send(body);
const count = async (t) => Number((await query(`SELECT count(*) AS n FROM ${t}`))[0].n);

describe('POST /api/auth/signup (BE-06)', () => {
  it('201, users 1행 + 기본 카테고리 1행, 해시 저장, 응답에 비밀번호·쿠키 없음', async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), email: valid.email, name: valid.name });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);

    const users = await query('SELECT * FROM users');
    expect(users).toHaveLength(1);
    expect(users[0].passwordHash).not.toBe(valid.password);
    expect(users[0].passwordHash).toMatch(/^\$2[aby]\$/);
    const cats = await query('SELECT * FROM categories');
    expect(cats).toHaveLength(1);
    expect(cats[0]).toMatchObject({ name: '기본', isDefault: true, userId: users[0].id });
  });

  it('대소문자·공백만 다른 이메일 재가입은 409, 행 수 불변', async () => {
    await post(valid);
    const res = await post({ ...valid, email: '  A@Example.COM ' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(await count('users')).toBe(1);
    expect(await count('categories')).toBe(1);
  });

  it('이메일은 공백 제거·소문자로 저장', async () => {
    const res = await post({ ...valid, email: '  MiXed@Example.com ' });
    expect(res.body.email).toBe('mixed@example.com');
  });

  describe('검증 400 VALIDATION_ERROR + fields', () => {
    const bad = async (body, field) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toHaveProperty(field);
      expect(await count('users')).toBe(0);
    };

    it('이메일 형식 오류', () => bad({ ...valid, email: 'not-an-email' }, 'email'));
    it('비밀번호 7자 거부', () => bad({ ...valid, password: '1234567' }, 'password'));
    it('이름 빈 값 거부', () => bad({ ...valid, name: '' }, 'name'));
    it('이름 51자 거부', () => bad({ ...valid, name: 'a'.repeat(51) }, 'name'));
    it('필수 누락', async () => {
      const res = await post({});
      expect(res.status).toBe(400);
      expect(Object.keys(res.body.error.fields).sort()).toEqual(['email', 'name', 'password']);
    });
  });

  it('비밀번호 8자·이름 50자 허용', async () => {
    const res = await post({ ...valid, password: '12345678', name: 'a'.repeat(50) });
    expect(res.status).toBe(201);
  });

  it('알 수 없는 필드(id, isDefault)는 무시', async () => {
    const res = await post({ ...valid, id: 999, isDefault: false, passwordHash: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe(999);
    const users = await query('SELECT * FROM users');
    expect(users[0].id).not.toBe(999);
    expect(users[0].passwordHash).not.toBe('x');
  });

  it('기본 카테고리 INSERT 실패 시 users도 롤백(500)', async () => {
    await pool.query(
      `CREATE FUNCTION fail_trg() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'forced'; END$$`,
    );
    await pool.query(
      'CREATE TRIGGER t BEFORE INSERT ON categories FOR EACH ROW EXECUTE FUNCTION fail_trg()',
    );
    try {
      const res = await post(valid);
      expect(res.status).toBe(500);
      expect(await count('users')).toBe(0);
    } finally {
      await pool.query('DROP TRIGGER IF EXISTS t ON categories');
      await pool.query('DROP FUNCTION IF EXISTS fail_trg()');
    }
  });
});
