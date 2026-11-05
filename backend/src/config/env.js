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
  // 쉼표로 여러 출처. cors는 문자열 완전 일치로 비교하므로 경로·끝 슬래시 없는 출처 형식만 허용
  FRONTEND_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().refine((o) => URL.canParse(o) && new URL(o).origin === o)).min(1)),
});

export function parseEnv(source) {
  // 운영에서 개발 기본값(localhost)으로 조용히 뜨지 않게 한다
  if (source.NODE_ENV === 'production' && !source.FRONTEND_ORIGIN?.trim()) {
    throw new Error('환경 변수 오류: FRONTEND_ORIGIN');
  }
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
