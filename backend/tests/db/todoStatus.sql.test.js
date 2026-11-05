import { afterAll, describe, expect, it } from 'vitest';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import {
  deriveStatus,
  overlapCondition,
  STATUS,
  statusCondition,
} from '../../src/domain/todoStatus.js';

afterAll(() => pool.end());

const d = (day) => `2026-11-${String(day).padStart(2, '0')}`;
const dd = (m, day) => `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

async function seed() {
  const [u] = await query(
    "INSERT INTO users (email, password_hash, name) VALUES ('a@example.com', 'x', 'a') RETURNING id",
  );
  const [c] = await query(
    "INSERT INTO categories (user_id, name, is_default) VALUES ($1, '기본', true) RETURNING id",
    [u.id],
  );
  return { userId: u.id, categoryId: c.id };
}

const insert = async ({ userId, categoryId }, title, start, end, done) =>
  (
    await query(
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, categoryId, title, start, end, done],
    )
  )[0].id;

// [label, start, end, today, completed, expected]
const ST = [
  ['ST-01', 5, 7, 4, false, '시작 전'],
  ['ST-02', 4, 6, 4, false, '진행중'],
  ['ST-03', 3, 6, 4, false, '진행중'],
  ['ST-04', 2, 4, 4, false, '진행중'],
  ['ST-05', 4, 4, 4, false, '진행중'],
  ['ST-06', 5, 5, 4, false, '시작 전'],
  ['ST-07', 2, 4, 5, false, '기한 초과'],
  ['ST-08', 10, 12, 4, true, '완료'],
  ['ST-09', 3, 3, 4, false, '기한 초과'],
  ['ST-10 완료', 1, 3, 4, true, '완료'],
  ['ST-10 해제', 1, 3, 4, false, '기한 초과'],
  ['ST-11 완료', 10, 12, 4, true, '완료'],
  ['ST-11 해제', 10, 12, 4, false, '시작 전'],
  ['ST-12 완료', 3, 6, 4, true, '완료'],
  ['ST-12 해제', 3, 6, 4, false, '진행중'],
  ['ST-13', 1, 3, 10, true, '완료'],
];

describe('상태 SQL 조각 == deriveStatus (TP-02)', () => {
  it('ST-01~13 fixture를 today별로 그룹 실행해 일치', async () => {
    const ctx = await seed();
    const rows = [];
    for (const [label, s, e, t, done, expected] of ST) {
      const id = await insert(ctx, label, d(s), d(e), done);
      rows.push({
        id,
        today: d(t),
        todo: { startDate: d(s), endDate: d(e), isCompleted: done },
        expected,
      });
    }
    for (const today of new Set(rows.map((r) => r.today))) {
      const group = rows.filter((r) => r.today === today);
      for (const status of Object.values(STATUS)) {
        const got = await query(
          `SELECT id FROM todos WHERE user_id = $1 AND (${statusCondition(status, '$2')}) ORDER BY id`,
          [ctx.userId, today],
        );
        const gotIds = new Set(got.map((r) => r.id));
        for (const r of group) {
          expect(deriveStatus(r.todo, today)).toBe(r.expected);
          expect(gotIds.has(r.id)).toBe(r.expected === status);
        }
      }
    }
  });
});

describe('기간 겹침 SQL 조각 (CV-01~05)', () => {
  // [label, from, to, start, end, shown]
  const CV = [
    ['CV-01', dd(11, 1), dd(11, 30), dd(10, 28), dd(11, 3), true],
    ['CV-02', dd(11, 1), dd(11, 7), dd(11, 6), dd(11, 12), true],
    ['CV-03', dd(11, 1), dd(11, 7), dd(10, 25), dd(10, 31), false],
    ['CV-04', dd(11, 4), dd(11, 4), dd(11, 4), dd(11, 4), true],
    ['CV-05', dd(11, 4), dd(11, 4), dd(11, 5), dd(11, 6), false],
  ];

  it.each(CV)('%s', async (label, from, to, start, end, shown) => {
    const ctx = await seed();
    const id = await insert(ctx, label, start, end, false);
    const got = await query(
      `SELECT id FROM todos WHERE user_id = $1 AND (${overlapCondition('$2', '$3')})`,
      [ctx.userId, from, to],
    );
    expect(got.map((r) => r.id)).toEqual(shown ? [id] : []);
  });
});
