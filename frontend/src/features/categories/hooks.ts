import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from '../../api/categories';
import { queryKeys } from '../../lib/queryKeys';
import { useTodoFilterStore } from '../../stores/todoFilterStore';

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: listCategories });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useRenameCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameCategory(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_, id) => {
      // 소속 할일이 기본으로 이동했으니 목록·캘린더도 다시 받는다(BR-10, LP-11)
      useTodoFilterStore.getState().clearCategoryIf(id); // D-09
      return Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.categories }),
        qc.invalidateQueries({ queryKey: queryKeys.todos.all }),
        qc.invalidateQueries({ queryKey: queryKeys.calendar.all }),
      ]);
    },
  });
}
