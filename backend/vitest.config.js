import { defineConfig } from 'vitest/config';

process.env.TZ = 'America/Los_Angeles'; // TP-06: 비UTC에서 날짜 버그를 드러낸다

try {
  process.loadEnvFile('.env');
} catch {
  // .env 없으면 무시
}

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false, // 공유 테스트 DB (TP-04)
    coverage: {
      provider: 'v8',
      include: ['src/**', 'scripts/**'],
      exclude: ['src/server.js', '*.config.js', '**/*.test.js', 'tests/**'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
