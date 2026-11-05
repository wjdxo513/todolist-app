// 할일 목록 필터·페이지(LP-12). 필터를 바꾸면 1페이지로 돌아간다(WA-09).
import { create } from 'zustand';

export type StatusFilter = '시작 전' | '진행중' | '완료' | '기한 초과';

interface TodoFilterState {
  categoryId: number | null;
  status: StatusFilter | null;
  page: number;
  setCategory: (categoryId: number | null) => void;
  setStatus: (status: StatusFilter | null) => void;
  setPage: (page: number) => void;
  /** 삭제된 카테고리로 필터 중이면 '전체'로 되돌린다(D-09) */
  clearCategoryIf: (categoryId: number) => void;
}

export const useTodoFilterStore = create<TodoFilterState>()((set, get) => ({
  categoryId: null,
  status: null,
  page: 1,
  setCategory: (categoryId) => set({ categoryId, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setPage: (page) => set({ page }),
  clearCategoryIf: (categoryId) => {
    if (get().categoryId === categoryId) set({ categoryId: null, page: 1 });
  },
}));
