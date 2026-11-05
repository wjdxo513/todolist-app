import { describe, expect, it } from 'vitest';
import { db } from '../test/handlers';
import { createCategory, deleteCategory, listCategories, renameCategory } from './categories';

describe('api/categories (PRE-02)', () => {
  it('목록·추가·이름 변경·삭제 경로와 메서드', async () => {
    await expect(listCategories()).resolves.toHaveLength(2);
    const c = await createCategory('개인');
    await expect(renameCategory(c.id, '취미')).resolves.toMatchObject({ id: c.id, name: '취미' });
    await expect(deleteCategory(c.id)).resolves.toBeUndefined();
    expect(db.requests.map((r) => [r.method, r.path, r.body])).toEqual([
      ['GET', '/categories', undefined],
      ['POST', '/categories', { name: '개인' }],
      ['PATCH', `/categories/${c.id}`, { name: '취미' }],
      ['DELETE', `/categories/${c.id}`, undefined],
    ]);
  });
});
