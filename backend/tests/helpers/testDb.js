import pg from 'pg';

// TP-04: 반드시 _test DB만 사용한다.
export function getTestDbUrl() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !/_test(\?.*)?$/.test(url)) {
    throw new Error('TEST_DATABASE_URL must be set and end with _test');
  }
  return url;
}

export async function connect() {
  const client = new pg.Client({ connectionString: getTestDbUrl() });
  await client.connect();
  return client;
}

export async function resetDb(client) {
  await client.query('SET search_path TO public');
  await client.query('DROP SCHEMA IF EXISTS schema_sql_ref CASCADE');
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');
}
