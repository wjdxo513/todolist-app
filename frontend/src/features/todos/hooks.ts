import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  setTodoCompletion,
  updateTodo,
} from '../../api/todos';
import type { TodoUpdateRequest } from '../../api/types';
import { queryKeys, type TodoListParams } from '../../lib/queryKeys';

/** 변경 후 목록·캘린더(+상세)를 다시 받는다(LP-11) */
const invalidateTodos = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.todos.all }),
    qc.invalidateQueries({ queryKey: queryKeys.calendar.all }),
  ]);

export function useTodos(params: TodoListParams) {
  return useQuery({
    queryKey: queryKeys.todos.list(params),
    queryFn: () => listTodos(params),
    placeholderData: keepPreviousData, // 페이지·필터를 바꾸는 동안 이전 결과와 페이지 이동을 유지
  });
}

export function useTodo(id: number | null) {
  return useQuery({
    queryKey: queryKeys.todos.detail(id ?? 0),
    queryFn: () => getTodo(id!),
    enabled: id !== null,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createTodo, onSuccess: () => invalidateTodos(qc) });
}

export function useUpdateTodo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TodoUpdateRequest) => updateTodo(id, body),
    onSuccess: () => invalidateTodos(qc),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      setTodoCompletion(id, isCompleted),
    onSuccess: () => invalidateTodos(qc),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteTodo, onSuccess: () => invalidateTodos(qc) });
}
