import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DB_CONN_STRING: z.string().min(1),
  TEST_DATABASE_URL: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
  JWT_SECRET: z.string().min(64),
  BCRYPT_COST: z.coerce.number().int().min(4).max(31).default(10),
  FRONTEND_ORIGIN: z.url().default('http://localhost:5173'),
});

export function parseEnv(source) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => i.path.join('.')))].join(', ');
    throw new Error(`환경 변수 오류: ${names}`);
  }
  return Object.freeze(result.data);
}

export function loadEnv() {
  return parseEnv(process.env);
}
