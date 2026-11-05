import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveStatus, overlapCondition, STATUS, statusCondition } from './todoStatus.js';

const d = (day) => `2026-11-${String(day).padStart(2, '0')}`;
const { NOT_STARTED: NS, IN_PROGRESS: IP, DONE, OVERDUE: OD } = STATUS;

// [id, start, end, today, completed, expected]
const ST = [
  ['ST-01', 5, 7, 4, false, NS],
  ['ST-02', 4, 6, 4, false, IP],
  ['ST-03', 3, 6, 4, false, IP],
  ['ST-04', 2, 4, 4, false, IP],
  ['ST-05', 4, 4, 4, false, IP],
  ['ST-06', 5, 5, 4, false, NS],
  ['ST-07', 2, 4, 5, false, OD],
  ['ST-08', 10, 12, 4, true, DONE],
  ['ST-09', 3, 3, 4, false, OD],
  ['ST-10 완료', 1, 3, 4, true, DONE],
  ['ST-10 해제', 1, 3, 4, false, OD],
  ['ST-11 완료', 10, 12, 4, true, DONE],
  ['ST-11 해제', 10, 12, 4, false, NS],
  ['ST-12 완료', 3, 6, 4, true, DONE],
  ['ST-12 해제', 3, 6, 4, false, IP],
  ['ST-13', 1, 3, 10, true, DONE],
];

describe('deriveStatus ST-01~13', () => {
  it.each(ST)('%s', (_id, s, e, t, isCompleted, expected) => {
    expect(deriveStatus({ startDate: d(s), endDate: d(e), isCompleted }, d(t))).toBe(expected);
  });

  it('±1일 격자 전수: 정확히 한 상태, 완료면 항상 완료', () => {
    const offs = [8, 9, 10, 11, 12];
    const all = Object.values(STATUS);
    let n = 0;
    for (const s of offs)
      for (const e of offs.filter((x) => x >= s))
        for (const t of offs)
          for (const isCompleted of [true, false]) {
            const r = deriveStatus({ startDate: d(s), endDate: d(e), isCompleted }, d(t));
            expect(all.filter((v) => v === r)).toHaveLength(1);
            if (isCompleted) expect(r).toBe(DONE);
            else expect(r).not.toBe(DONE);
            n++;
          }
    expect(n).toBe(15 * 5 * 2);
  });
});

describe('SQL 조각 (SP-05)', () => {
  it('상태 조건은 자리표시자만 포함', () => {
    for (const s of Object.values(STATUS)) {
      const sql = statusCondition(s, '$1');
      expect(sql).toContain('$1');
      expect(sql).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(sql).not.toMatch(/['"]/);
    }
  });

  it('겹침 조건', () => {
    const sql = overlapCondition('$2', '$3');
    expect(sql).toContain('$2');
    expect(sql).toContain('$3');
    expect(sql).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(sql).not.toMatch(/['"]/);
  });

  it('잘못된 자리표시자·status는 throw', () => {
    for (const p of ['2026-11-04', "'$1'", '$', '$a', '$1; DROP TABLE todos', '']) {
      expect(() => statusCondition(IP, p)).toThrow();
      expect(() => overlapCondition(p, '$2')).toThrow();
      expect(() => overlapCondition('$1', p)).toThrow();
    }
    expect(() => statusCondition('unknown', '$1')).toThrow();
    expect(() => statusCondition("완료'; --", '$1')).toThrow();
  });
});

describe('환경·구조', () => {
  it('다른 모듈을 import하지 않는다 (LP 2.1)', () => {
    const src = readFileSync(new URL('./todoStatus.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/\bimport\b|\brequire\s*\(/);
  });

  it('TZ가 UTC가 아니다 (TP-06)', () => {
    expect(new Date().getTimezoneOffset()).not.toBe(0);
  });
});
