import request from 'supertest';

export const PW = 'password123';
let seq = 0;

export async function signup(app, overrides = {}) {
  const body = { email: `user${++seq}@example.com`, password: PW, name: '홍길동', ...overrides };
  const res = await request(app).post('/api/auth/signup').send(body);
  return { res, body };
}

export async function login(app, email, password = PW) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { res, cookies: res.headers['set-cookie'] ?? [] };
}

// 가입+로그인 후 { id, email, password, cookies } 반환. cookies는 supertest .set('Cookie', cookies)에 그대로 사용.
export async function authed(app, overrides = {}) {
  const { res: s, body } = await signup(app, overrides);
  const { cookies } = await login(app, body.email, body.password);
  return { id: s.body.id, email: body.email, password: body.password, cookies };
}
