import { withTransaction } from '../db/query.js';
import { AppError } from '../lib/errors.js';
import { isUniqueViolation } from '../lib/pgError.js';
import * as categories from '../repositories/categories.repository.js';
import * as todos from '../repositories/todos.repository.js';

const DUP = 'uq_categories_user_id_name';
const dupError = () => {
  const msg = '이미 같은 이름의 카테고리가 있습니다.';
  return new AppError(409, 'CATEGORY_NAME_DUPLICATE', msg, { name: msg });
};
const notFound = () => new AppError(404, 'NOT_FOUND', '찾을 수 없습니다.');
const protectedError = () =>
  new AppError(409, 'DEFAULT_CATEGORY_PROTECTED', '기본 카테고리는 수정하거나 삭제할 수 없습니다.');

export async function list(userId) {
  return { items: await categories.listByUser(userId) };
}

export async function create(userId, name) {
  try {
    return await categories.insert(userId, name);
  } catch (err) {
    throw isUniqueViolation(err, DUP) ? dupError() : err;
  }
}

export async function rename(userId, id, name) {
  const cat = await categories.findOwned(userId, id);
  if (!cat) throw notFound();
  if (cat.isDefault) throw protectedError();
  try {
    const updated = await categories.rename(userId, id, name);
    if (!updated) throw notFound(); // 조회 직후 삭제된 경우
    return updated;
  } catch (err) {
    throw isUniqueViolation(err, DUP) ? dupError() : err;
  }
}

export async function remove(userId, id) {
  try {
    await withTransaction(async (tx) => {
      const cat = await categories.findOwned(userId, id, tx);
      if (!cat) throw notFound();
      if (cat.isDefault) throw protectedError();
      const def = await categories.findDefault(userId, tx);
      await todos.moveToCategory(userId, id, def.id, tx);
      if ((await categories.deleteNonDefault(userId, id, tx)) === 0) throw notFound();
    });
  } catch (err) {
    if (err?.code === '23503') {
      throw new AppError(
        409,
        'CATEGORY_IN_USE',
        '카테고리가 사용 중이어서 삭제하지 못했습니다. 다시 시도해 주세요.',
      );
    }
    throw err;
  }
}
