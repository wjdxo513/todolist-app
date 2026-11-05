import { useNavigate, useParams } from 'react-router';
import { isApiError } from '../api/client';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { NotFoundPanel } from '../components/ui/NotFoundPanel';
import { useCategories } from '../features/categories';
import { TodoForm, useTodo } from '../features/todos';
import { MESSAGES } from '../lib/messages';
import { ROUTES } from '../lib/routes';

/** SC-06. /todos/new = 등록, /todos/:id/edit = 편집. 타인·없는·잘못된 ID는 같은 '찾을 수 없음'(SN-13, 5.7) */
export function TodoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const todoId = id === undefined ? null : /^[1-9]\d{0,9}$/.test(id) ? Number(id) : NaN;
  const todo = useTodo(Number.isNaN(todoId) ? null : todoId);
  const categories = useCategories(); // 편집 시 '선택 안 함' 매핑에 기본 카테고리 ID가 필요하다

  const notFound = <NotFoundPanel onBack={() => navigate(ROUTES.todos)} />;
  if (Number.isNaN(todoId)) return notFound;
  if (categories.isPending || (todoId !== null && todo.isPending))
    return <p role="status">불러오는 중…</p>;
  if (todoId !== null && todo.isError) {
    return isApiError(todo.error) && todo.error.status === 404 ? (
      notFound
    ) : (
      <ErrorBanner message={MESSAGES.generic} />
    );
  }
  return <TodoForm key={todoId ?? 'new'} todo={todo.data} />;
}
