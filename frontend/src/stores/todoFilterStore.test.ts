import { beforeEach, describe, expect, it } from 'vitest';
import { useTodoFilterStore } from './todoFilterStore';

const s = () => useTodoFilterStore.getState();

describe('todoFilterStore (WA-09, TP-15)', () => {
  beforeEach(() => s().setPage(3));

  it('카테고리·상태 필터를 바꾸면 페이지가 1로 돌아간다', () => {
    s().setCategory(2);
    expect(s()).toMatchObject({ categoryId: 2, page: 1 });
    s().setPage(3);
    s().setStatus('완료');
    expect(s()).toMatchObject({ status: '완료', page: 1 });
  });

  it('삭제된 카테고리로 필터 중일 때만 전체로 되돌린다(D-09)', () => {
    s().setCategory(2);
    s().setPage(4);
    s().clearCategoryIf(5);
    expect(s()).toMatchObject({ categoryId: 2, page: 4 });
    s().clearCategoryIf(2);
    expect(s()).toMatchObject({ categoryId: null, page: 1 });
  });
});
