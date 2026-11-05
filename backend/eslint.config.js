import js from '@eslint/js';
import globals from 'globals';

const ban = (files, groups) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: groups.map((g) => ({ group: [g], message: '레이어 의존 방향 위반(2.1)' })) },
    ],
  },
});

export default [
  { ignores: ['coverage/', 'node_modules/'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  ban(['src/controllers/**'], ['**/repositories/**', '**/db/**']),
  ban(['src/routes/**'], ['**/services/**', '**/repositories/**', '**/db/**']),
  ban(['src/services/**'], ['**/controllers/**', '**/routes/**']),
  ban(['src/repositories/**'], ['**/services/**', '**/controllers/**', '**/routes/**']),
  ban(['src/domain/**/!(*.test).js'], ['./*', '../*']),
];
