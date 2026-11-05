import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { envSchema, loadEnv, parseEnv } from '../../src/config/env.js';

const base = { DB_CONN_STRING: 'postgresql://u:p@localhost:5432/db', JWT_SECRET: 'x'.repeat(64) };

describe('parseEnv', () => {
  it.each(['DB_CONN_STRING', 'JWT_SECRET'])('%s 누락 시 변수명을 담아 throw', (key) => {
    const src = { ...base };
    delete src[key];
    expect(() => parseEnv(src)).toThrow(key);
  });

  it('JWT_SECRET 63자는 throw, 64자는 성공', () => {
    expect(() => parseEnv({ ...base, JWT_SECRET: 'x'.repeat(63) })).toThrow('JWT_SECRET');
    expect(parseEnv({ ...base, JWT_SECRET: 'x'.repeat(64) }).JWT_SECRET).toHaveLength(64);
  });

  it.each([
    ['PORT', 'abc'],
    ['DB_POOL_MAX', '3.5'],
    ['BCRYPT_COST', '3'],
  ])('%s=%s 는 throw', (key, value) => {
    expect(() => parseEnv({ ...base, [key]: value })).toThrow(key);
  });

  it('정상 값은 숫자로 변환하고 frozen 객체를 반환', () => {
    const env = parseEnv({ ...base, PORT: '4000', DB_POOL_MAX: '5', BCRYPT_COST: '12' });
    expect(env.PORT).toBe(4000);
    expect(env.DB_POOL_MAX).toBe(5);
    expect(env.BCRYPT_COST).toBe(12);
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('기본값 적용', () => {
    expect(parseEnv(base)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      DB_POOL_MAX: 10,
      BCRYPT_COST: 10,
      FRONTEND_ORIGIN: ['http://localhost:5173'],
    });
  });

  it('FRONTEND_ORIGIN은 쉼표로 여러 출처를 받고 공백·빈 항목을 무시', () => {
    const env = parseEnv({
      ...base,
      FRONTEND_ORIGIN: ' http://localhost:5173, https://app.example.com ,',
    });
    expect(env.FRONTEND_ORIGIN).toEqual(['http://localhost:5173', 'https://app.example.com']);
  });

  it.each(['not-a-url', 'https://app.example.com/', 'https://app.example.com/path', ','])(
    'FRONTEND_ORIGIN=%s 는 throw',
    (value) => {
      expect(() => parseEnv({ ...base, FRONTEND_ORIGIN: value })).toThrow('FRONTEND_ORIGIN');
    },
  );

  it('운영에서 FRONTEND_ORIGIN 누락·빈값은 throw, 지정하면 성공', () => {
    const prod = { ...base, NODE_ENV: 'production' };
    expect(() => parseEnv(prod)).toThrow('FRONTEND_ORIGIN');
    expect(() => parseEnv({ ...prod, FRONTEND_ORIGIN: '  ' })).toThrow('FRONTEND_ORIGIN');
    expect(
      parseEnv({ ...prod, FRONTEND_ORIGIN: 'https://app.example.com' }).FRONTEND_ORIGIN,
    ).toEqual(['https://app.example.com']);
  });
});

describe('loadEnv', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('process.env 기반으로 동작', () => {
    vi.stubEnv('DB_CONN_STRING', base.DB_CONN_STRING);
    vi.stubEnv('JWT_SECRET', base.JWT_SECRET);
    vi.stubEnv('PORT', '4321');
    expect(loadEnv().PORT).toBe(4321);
  });
});

describe('.env.example (SP-02)', () => {
  it('키 집합이 envSchema와 일치', () => {
    const text = readFileSync(
      fileURLToPath(new URL('../../.env.example', import.meta.url)),
      'utf8',
    );
    const keys = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => l.split('=')[0].trim());
    expect(new Set(keys)).toEqual(new Set(Object.keys(envSchema.shape)));
  });
});
