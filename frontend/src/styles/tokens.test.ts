import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const src = path.resolve(import.meta.dirname, '..');

// prettier가 바꾸는 표기(hex 대소문자, 따옴표, 줄바꿈)는 같은 값으로 본다
const normalize = (v: string) => v.toLowerCase().replaceAll('"', "'").replace(/\s+/g, ' ').trim();

/** 9번 문서 3장 표의 `--name` | `value` 행 */
function docTokens(): Record<string, string> {
  const doc = readFileSync(path.resolve(src, '../../docs/9-style-guide.md'), 'utf8');
  const section = doc.slice(doc.indexOf('\n## 3.'), doc.indexOf('\n## 4.'));
  const rows = section.matchAll(/^\|\s*`(--[\w-]+)`\s*\|\s*`([^`]+)`\s*\|/gm);
  return Object.fromEntries([...rows].map(([, k, v]) => [k, normalize(v)]));
}

function cssTokens(): Record<string, string> {
  const css = readFileSync(path.join(src, 'styles/tokens.css'), 'utf8');
  const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const decls = root.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g);
  return Object.fromEntries([...decls].map(([, k, v]) => [k, normalize(v)]));
}

describe('tokens.css (PRE-01)', () => {
  it('변수 이름·값·개수가 스타일 가이드 3장 표와 일치한다', () => {
    const doc = docTokens();
    expect(Object.keys(doc).length).toBeGreaterThan(50);
    expect(cssTokens()).toEqual(doc);
  });

  it('components의 CSS에 색상 리터럴(#hex, rgb()이 없다', () => {
    const dir = path.join(src, 'components');
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.module.css'),
    );
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((f) =>
      /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(readFileSync(path.join(dir, f), 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
