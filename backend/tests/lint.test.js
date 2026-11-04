import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const backend = fileURLToPath(new URL('..', import.meta.url));
const code =
  "import { findById } from '../repositories/users.repository.js';\nexport const x = findById;\n";

async function lint(rel) {
  const eslint = new ESLint({ cwd: backend });
  const [result] = await eslint.lintText(code, { filePath: `${backend}/${rel}` });
  return result.messages;
}

describe('LP-01 계층 import 규칙', () => {
  it('controllers -> repositories 는 no-restricted-imports 오류', async () => {
    const messages = await lint('src/controllers/example.controller.js');
    expect(messages.some((m) => m.ruleId === 'no-restricted-imports' && m.severity === 2)).toBe(
      true,
    );
  });

  it('services -> repositories 는 오류 없음', async () => {
    const messages = await lint('src/services/x.service.js');
    expect(messages.filter((m) => m.ruleId === 'no-restricted-imports')).toEqual([]);
  });
});
