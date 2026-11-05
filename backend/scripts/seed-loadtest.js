// 부하 테스트 시드(DB-03). 빈 DB에서만 실행한다.
// PA-07 카테고리 5개는 기본 포함으로 고정(8-plan D-15): '기본'(is_default) 1개 + 일반 4개.
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { parseEnv } from '../src/config/env.js';
import { hashPassword } from '../src/lib/password.js';

const CATEGORY_NAMES = ['기본', '업무', '개인', '공부', '운동'];

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function seed({
  connectionString,
  users = 1000,
  todosPerUser = 200,
  today = localToday(),
  password = 'loadtest1234',
}) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const { rows } = await client.query('SELECT count(*)::int AS n FROM users');
    if (rows[0].n !== 0) throw new Error('users 테이블이 비어 있지 않아 시드를 중단합니다.');
    const hash = await hashPassword(password);
    await client.query('BEGIN');
    try {
      await client.query(
        `INSERT INTO users (email, password_hash, name)
         SELECT 'loadtest' || i || '@example.com', $1, '부하' || i FROM generate_series(1, $2::int) i`,
        [hash, users],
      );
      await client.query(
        `INSERT INTO categories (user_id, name, is_default)
         SELECT u.id, n.name, n.ord = 1
         FROM users u CROSS JOIN unnest($1::text[]) WITH ORDINALITY AS n(name, ord)`,
        [CATEGORY_NAMES],
      );
      // k=i%4: 0 시작 전, 1 진행중, 2 완료(과거), 3 기한 초과(미완료)
      await client.query(
        `INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed)
         SELECT u.id, c.id, '할일 ' || g.i,
                $3::date + s.d, $3::date + s.d + s.len, g.i % 4 = 2
         FROM users u
         CROSS JOIN generate_series(1, $2::int) g(i)
         CROSS JOIN LATERAL (
           SELECT CASE g.i % 4 WHEN 0 THEN 3 WHEN 1 THEN -2 WHEN 2 THEN -10 ELSE -10 END AS d,
                  CASE g.i % 4 WHEN 0 THEN 5 WHEN 1 THEN 5 WHEN 2 THEN 3 ELSE 3 END AS len
         ) s
         JOIN categories c ON c.user_id = u.id
          AND c.name = ($1::text[])[g.i % 5 + 1]`,
        [CATEGORY_NAMES, todosPerUser, today],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
    return { users, todos: users * todosPerUser, categories: users * CATEGORY_NAMES.length };
  } finally {
    await client.end();
  }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  try {
    const opt = {};
    for (let i = 0; i < argv.length; i += 2) {
      const n = Number(argv[i + 1]);
      if (!['--users', '--todos'].includes(argv[i]) || !Number.isInteger(n) || n < 0)
        throw new Error('사용법: --users N --todos M');
      opt[argv[i] === '--users' ? 'users' : 'todosPerUser'] = n;
    }
    const r = await seed({ connectionString: parseEnv(env).DB_CONN_STRING, ...opt });
    console.log(`시드 완료: users ${r.users}, categories ${r.categories}, todos ${r.todos}`);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

/* v8 ignore next */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
