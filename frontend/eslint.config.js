import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// 프론트 레이어 의존 방향(5번 문서 2.2): components는 lib(+ api/types 타입), api·stores는 lib만
const ban = (files, patterns) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: patterns.map((p) => ({ ...p, message: '레이어 의존 방향 위반(2.2)' })) },
    ],
  },
});
const upper = ['app', 'pages', 'features'];
const any = (dirs) => dirs.flatMap((d) => [`**/${d}/**`, `**/${d}`]);

export default tseslint.config(
  { ignores: ['coverage/', 'dist/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'api/client.ts만 fetch를 쓴다(LP-08)' },
      ],
    },
  },
  { files: ['src/api/client.ts'], rules: { 'no-restricted-globals': 'off' } },
  ban(
    ['src/components/**'],
    [
      { group: any([...upper, 'stores']) },
      { group: ['**/api/*', '!**/api/types'], allowTypeImports: false },
    ],
  ),
  ban(['src/api/**'], [{ group: any([...upper, 'stores', 'components']) }]),
  ban(['src/stores/**'], [{ group: any([...upper, 'api', 'components']) }]),
  ban(['src/lib/**'], [{ group: any([...upper, 'api', 'stores', 'components']) }]),
  ban(['src/features/**'], [{ group: any(['app', 'pages']) }]),
  ban(['src/pages/**'], [{ group: any(['app']) }]),
);
