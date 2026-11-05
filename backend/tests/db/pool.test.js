import { afterAll, describe, expect, it, vi } from 'vitest';
import { pool } from '../../src/db/pool.js';
import { query, withTransaction } from '../../src/db/query.js';
import { logger } from '../../src/lib/logger.js';

afterAll(() => pool.end());

async function seedCategory() {
  const [u] = await query(
    `INSERT INTO users (email, password_hash, name) VALUES ('a@b.com', 'h', 'n') RETURNING id`,
  );
  const [c] = await query(`INSERT INTO categories (user_id, name) VALUES ($1, 'c') RETURNING id`, [
    u.id,
  ]);
  return { userId: u.id, categoryId: c.id };
}

describe('date 왕복 (TP-14, NP-18)', () => {
  it.each(['2024-02-29', '2026-03-01', '2026-12-31'])('%s 가 그대로 돌아온다', async (d) => {
    const { userId, categoryId } = await seedCategory();
    const [row] = await query(
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date)
       VALUES ($1, $2, 't', $3, $3) RETURNING start_date, end_date`,
      [userId, categoryId, d],
    );
    expect(row.startDate).toBe(d);
    expect(row.endDate).toBe(d);
    const [sel] = await query('SELECT $1::date AS d', [d]);
    expect(sel.d).toBe(d);
  });
});

describe('타입·키 변환', () => {
  it('count(*) 는 Number', async () => {
    const [r] = await query('SELECT count(*) AS n FROM todos');
    expect(r.n).toBe(0);
    expect(typeof r.n).toBe('number');
  });

  it('camelCase 키와 $n 바인딩', async () => {
    const { userId, categoryId } = await seedCategory();
    const evil = "x'; DROP TABLE todos; --";
    const rows = await query(
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date)
       VALUES ($1, $2, $3, '2026-03-01', '2026-03-01') RETURNING *`,
      [userId, categoryId, evil],
    );
    expect(rows[0]).toHaveProperty('createdAt');
    expect(rows[0]).toHaveProperty('isCompleted', false);
    expect(rows[0]).not.toHaveProperty('created_at');
    expect(rows[0].title).toBe(evil);
    expect(await query('SELECT count(*) AS n FROM todos')).toEqual([{ n: 1 }]);
  });
});

describe('withTransaction (LP-03, SP-10)', () => {
  const insertUser = (client, email) =>
    query(`INSERT INTO users (email, password_hash, name) VALUES ($1, 'h', 'n')`, [email], client);

  it('성공 시 커밋하고 클라이언트를 반환한다', async () => {
    const result = await withTransaction(async (client) => {
      await insertUser(client, 'ok@b.com');
      return 'done';
    });
    expect(result).toBe('done');
    expect((await query('SELECT count(*) AS n FROM users'))[0].n).toBe(1);
    expect(pool.idleCount).toBe(pool.totalCount); // 대여 중인 클라이언트 없음
  });

  it('예외 시 롤백하고 재throw, 클라이언트를 반환한다', async () => {
    await expect(
      withTransaction(async (client) => {
        await insertUser(client, 'fail@b.com');
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect((await query('SELECT count(*) AS n FROM users'))[0].n).toBe(0);
    expect(pool.idleCount).toBe(pool.totalCount);
  });
});

describe('pool error 이벤트 (SP-10)', () => {
  it('유휴 클라이언트 오류를 logger로 기록한다', () => {
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    pool.emit('error', new Error('idle client lost'));
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
