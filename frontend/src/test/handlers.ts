// MSW 핸들러: backend/swagger.yaml 형태를 흉내 내는 메모리 백엔드(TP-05).
// 상태 판정은 테스트용 근사이며 앱 코드는 이 값을 표시만 한다(LP-13).
import { http, HttpResponse, type PathParams } from 'msw';
import type { Category, Todo, TodoStatus, TodoWithStatus, User } from '../api/types';

export const API = 'http://localhost:3000/api';

interface Db {
  isLoggedIn: boolean;
  user: User;
  password: string;
  categories: Category[];
  todos: Todo[];
  nextId: number;
  requests: { method: string; path: string; search: string; body?: unknown }[];
}

const seed = (): Db => ({
  isLoggedIn: true,
  user: { id: 1, email: 'hong@example.com', name: '홍길동' },
  password: 'password123',
  categories: [
    { id: 1, name: '기본', isDefault: true },
    { id: 2, name: '업무', isDefault: false },
  ],
  todos: [],
  nextId: 100,
  requests: [],
});

export let db: Db = seed();
export const resetDb = () => {
  db = seed();
};

let seq = 0;
export function makeTodo(
  partial: Partial<Todo> & Pick<Todo, 'title' | 'startDate' | 'endDate'>,
): Todo {
  seq += 1;
  const todo: Todo = {
    id: db.nextId++,
    categoryId: 1,
    memo: null,
    isCompleted: false,
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, 0, seq)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 10, 1, 0, 0, seq)).toISOString(),
    ...partial,
  };
  db.todos.push(todo);
  return todo;
}

export function statusOf(t: Todo, today: string): TodoStatus {
  if (t.isCompleted) return '완료';
  if (t.endDate < today) return '기한 초과';
  if (t.startDate > today) return '시작 전';
  return '진행중';
}

const withStatus = (t: Todo, today: string): TodoWithStatus => ({
  ...t,
  status: statusOf(t, today),
});
const sort = (a: Todo, b: Todo) =>
  a.endDate.localeCompare(b.endDate) || a.createdAt.localeCompare(b.createdAt) || a.id - b.id;

export const err = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) => HttpResponse.json({ error: { code, message, ...(fields && { fields }) } }, { status });

const unauth = () => err(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
const notFound = () => err(404, 'NOT_FOUND', '찾을 수 없습니다.');

async function record(request: Request) {
  const url = new URL(request.url);
  let body: unknown;
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    body = await request
      .clone()
      .json()
      .catch(() => undefined);
  }
  db.requests.push({
    method: request.method,
    path: url.pathname.replace('/api', ''),
    search: url.search,
    body,
  });
}

/** 인증이 필요한 핸들러 래퍼 */
const authed =
  (fn: (args: { request: Request; params: PathParams }) => Response | Promise<Response>) =>
  async ({ request, params }: { request: Request; params: PathParams }) => {
    await record(request);
    if (!db.isLoggedIn) return unauth();
    return fn({ request, params });
  };

type TodoBody = Partial<Todo> & { categoryId?: number | null };

export const handlers = [
  http.post(`${API}/auth/signup`, async ({ request }) => {
    await record(request);
    const body = (await request.json()) as { email: string; name: string };
    if (body.email === db.user.email) {
      return err(409, 'EMAIL_ALREADY_EXISTS', '이미 가입된 이메일입니다.', {
        email: '이미 가입된 이메일입니다.',
      });
    }
    return HttpResponse.json({ id: 2, email: body.email, name: body.name }, { status: 201 });
  }),
  http.post(`${API}/auth/login`, async ({ request }) => {
    await record(request);
    const body = (await request.json()) as { email: string; password: string };
    if (body.email !== db.user.email || body.password !== db.password) {
      return err(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    db.isLoggedIn = true;
    return HttpResponse.json(db.user);
  }),
  http.post(`${API}/auth/refresh`, async ({ request }) => {
    await record(request);
    return db.isLoggedIn ? new HttpResponse(null, { status: 204 }) : unauth();
  }),
  http.post(`${API}/auth/logout`, async ({ request }) => {
    await record(request);
    db.isLoggedIn = false;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(
    `${API}/users/me`,
    authed(() => HttpResponse.json(db.user)),
  ),
  http.patch(
    `${API}/users/me`,
    authed(async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      db.user = { ...db.user, name };
      return HttpResponse.json(db.user);
    }),
  ),
  http.put(
    `${API}/users/me/password`,
    authed(async ({ request }) => {
      const body = (await request.json()) as { currentPassword: string; newPassword: string };
      if (body.currentPassword !== db.password) {
        return err(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', {
          currentPassword: '현재 비밀번호가 일치하지 않습니다.',
        });
      }
      db.password = body.newPassword;
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  http.get(
    `${API}/categories`,
    authed(() => HttpResponse.json({ items: db.categories })),
  ),
  http.post(
    `${API}/categories`,
    authed(async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      if (db.categories.some((c) => c.name === name)) {
        return err(409, 'CATEGORY_NAME_DUPLICATE', '이미 같은 이름의 카테고리가 있습니다.', {
          name: '이미 같은 이름의 카테고리가 있습니다.',
        });
      }
      const c = { id: db.nextId++, name, isDefault: false };
      db.categories.push(c);
      return HttpResponse.json(c, { status: 201 });
    }),
  ),
  http.patch(
    `${API}/categories/:id`,
    authed(async ({ request, params }) => {
      const { name } = (await request.json()) as { name: string };
      const c = db.categories.find((x) => x.id === Number(params.id));
      if (!c) return notFound();
      if (db.categories.some((x) => x.name === name && x.id !== c.id)) {
        return err(409, 'CATEGORY_NAME_DUPLICATE', '이미 같은 이름의 카테고리가 있습니다.', {
          name: '이미 같은 이름의 카테고리가 있습니다.',
        });
      }
      c.name = name;
      return HttpResponse.json(c);
    }),
  ),
  http.delete(
    `${API}/categories/:id`,
    authed(({ params }) => {
      const id = Number(params.id);
      const c = db.categories.find((x) => x.id === id);
      if (!c) return notFound();
      if (c.isDefault)
        return err(
          409,
          'DEFAULT_CATEGORY_PROTECTED',
          '기본 카테고리는 수정하거나 삭제할 수 없습니다.',
        );
      db.categories = db.categories.filter((x) => x.id !== id);
      db.todos.forEach((t) => {
        if (t.categoryId === id) t.categoryId = 1;
      });
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  http.get(
    `${API}/todos`,
    authed(({ request }) => {
      const q = new URL(request.url).searchParams;
      const today = q.get('today');
      if (!today) return err(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', { today: '필수' });
      const page = Number(q.get('page') ?? 1);
      const categoryId = q.get('categoryId');
      const status = q.get('status');
      const all = db.todos
        .filter((t) => !categoryId || t.categoryId === Number(categoryId))
        .map((t) => withStatus(t, today))
        .filter((t) => !status || t.status === status)
        .sort(sort);
      return HttpResponse.json({
        items: all.slice((page - 1) * 50, page * 50),
        page,
        pageSize: 50,
        totalCount: all.length,
      });
    }),
  ),
  http.get(
    `${API}/todos/calendar`,
    authed(({ request }) => {
      const q = new URL(request.url).searchParams;
      const [from, to, today] = ['from', 'to', 'today'].map((k) => q.get(k) ?? '');
      const items = db.todos
        .filter((t) => t.startDate <= to && t.endDate >= from)
        .sort(sort)
        .map((t) => withStatus(t, today));
      return HttpResponse.json({ items });
    }),
  ),
  http.post(
    `${API}/todos`,
    authed(async ({ request }) => {
      const body = (await request.json()) as TodoBody &
        Pick<Todo, 'title' | 'startDate' | 'endDate'>;
      const todo = makeTodo({ ...body, categoryId: body.categoryId ?? 1, memo: body.memo || null });
      return HttpResponse.json(todo, { status: 201 });
    }),
  ),
  http.get(
    `${API}/todos/:id`,
    authed(({ params }) => {
      const t = db.todos.find((x) => x.id === Number(params.id));
      return t ? HttpResponse.json(t) : notFound();
    }),
  ),
  http.put(
    `${API}/todos/:id`,
    authed(async ({ request, params }) => {
      const t = db.todos.find((x) => x.id === Number(params.id));
      if (!t) return notFound();
      const body = (await request.json()) as TodoBody;
      Object.assign(t, body, { categoryId: body.categoryId ?? 1, memo: body.memo || null });
      return HttpResponse.json(t);
    }),
  ),
  http.patch(
    `${API}/todos/:id/completion`,
    authed(async ({ request, params }) => {
      const t = db.todos.find((x) => x.id === Number(params.id));
      if (!t) return notFound();
      t.isCompleted = ((await request.json()) as { isCompleted: boolean }).isCompleted;
      return HttpResponse.json(t);
    }),
  ),
  http.delete(
    `${API}/todos/:id`,
    authed(({ params }) => {
      const before = db.todos.length;
      db.todos = db.todos.filter((x) => x.id !== Number(params.id));
      return db.todos.length < before ? new HttpResponse(null, { status: 204 }) : notFound();
    }),
  ),
];
