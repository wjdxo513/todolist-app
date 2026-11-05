import { deriveStatus } from '../domain/todoStatus.js';
import { AppError } from '../lib/errors.js';
import * as categories from '../repositories/categories.repository.js';
import * as todos from '../repositories/todos.repository.js';

const notFound = () => new AppError(404, 'NOT_FOUND', '찾을 수 없습니다.');

const PAGE_SIZE = 50;

const toDto = (r) => ({
  id: r.id,
  categoryId: r.categoryId,
  title: r.title,
  memo: r.memo,
  startDate: r.startDate,
  endDate: r.endDate,
  isCompleted: r.isCompleted,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

async function resolveCategoryId(userId, categoryId) {
  const cat = categoryId
    ? await categories.findOwned(userId, categoryId)
    : await categories.findDefault(userId);
  if (!cat) throw notFound();
  return cat.id;
}

// 조회와 쓰기 사이에 카테고리가 삭제된 경우
const fkToNotFound = (err) =>
  err?.code === '23503' && err.constraint === 'fk_todos_category_id_user_id' ? notFound() : err;

export async function create(userId, input) {
  const categoryId = await resolveCategoryId(userId, input.categoryId);
  try {
    return toDto(await todos.insert(userId, { ...input, categoryId }));
  } catch (err) {
    throw fkToNotFound(err);
  }
}

export async function get(userId, id) {
  const row = await todos.findOwned(userId, id);
  if (!row) throw notFound();
  return toDto(row);
}

export async function update(userId, id, input) {
  const categoryId = await resolveCategoryId(userId, input.categoryId);
  try {
    const row = await todos.update(userId, id, { ...input, categoryId });
    if (!row) throw notFound();
    return toDto(row);
  } catch (err) {
    throw fkToNotFound(err);
  }
}

export async function setCompletion(userId, id, isCompleted) {
  const row = await todos.setCompletion(userId, id, isCompleted);
  if (!row) throw notFound();
  return toDto(row);
}

export async function remove(userId, id) {
  if ((await todos.remove(userId, id)) === 0) throw notFound();
}

const withStatus = (r, today) => ({ ...toDto(r), status: deriveStatus(r, today) });

export async function list(userId, { today, categoryId, status, page }) {
  if (categoryId !== undefined && !(await categories.findOwned(userId, categoryId))) {
    throw notFound();
  }
  const filter = { today, categoryId, status };
  const [rows, totalCount] = await Promise.all([
    todos.findPage(userId, filter, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    todos.countFiltered(userId, filter),
  ]);
  return {
    items: rows.map((r) => withStatus(r, today)),
    page,
    pageSize: PAGE_SIZE,
    totalCount,
  };
}

export async function calendar(userId, { from, to, today }) {
  const rows = await todos.findOverlapping(userId, from, to);
  return { items: rows.map((r) => withStatus(r, today)) };
}
