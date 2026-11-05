import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

process.env.TZ = 'America/Los_Angeles'; // TP-06: 비UTC에서 날짜 밀림을 드러낸다

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      env: { VITE_API_BASE_URL: 'http://localhost:3000/api' },
      css: { modules: { classNameStrategy: 'non-scoped' } },
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: [
          'src/main.tsx',
          'src/test/**',
          'src/**/*.test.{ts,tsx}',
          'src/**/*.d.ts',
          'src/api/types.ts',
        ],
        thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  }),
);
