// @vitest-environment node
// ESLint 규칙 자체를 Node API로 검사한다(TP-07, LP-08, 5번 문서 2.2)
import { ESLint } from 'eslint';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: path.resolve(import.meta.dirname, '../..') });

async function ruleIds(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.severity === 2).map((m) => m.ruleId);
}

describe('ESLint 설정', { timeout: 30_000 }, () => {
  it('any 사용을 오류로 보고한다(TP-07)', async () => {
    const ids = await ruleIds('export const f = (x: any) => x;\n', 'src/lib/__sample.ts');
    expect(ids).toContain('@typescript-eslint/no-explicit-any');
  });

  it('components/가 stores/·api/를 import하면 오류, api/types 타입 import는 허용한다(LP 2.2)', async () => {
    const file = 'src/components/ui/__Sample.tsx';
    expect(
      await ruleIds(
        "import { useSessionStore } from '../../stores/sessionStore';\nexport const a = useSessionStore;\n",
        file,
      ),
    ).toEqual(['no-restricted-imports']);
    expect(
      await ruleIds(
        "import { request } from '../../api/client';\nexport const a = request;\n",
        file,
      ),
    ).toEqual(['no-restricted-imports']);
    expect(
      await ruleIds("import type { Todo } from '../../api/types';\nexport type A = Todo;\n", file),
    ).toEqual([]);
  });

  it('api/client.ts 밖의 fetch 사용을 오류로 보고한다(LP-08)', async () => {
    const code = "export const g = () => fetch('/x');\n";
    expect(await ruleIds(code, 'src/features/__sample.ts')).toContain('no-restricted-globals');
    expect(await ruleIds(code, 'src/api/client.ts')).toEqual([]);
  });
});
