import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TODO_STATUSES, type TodoWithStatus } from '../../../api/types';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { Pagination } from '../../../components/ui/Pagination';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { formatShort, todayLocal } from '../../../lib/date';
import { PAGE_SIZE } from '../../../lib/limits';
import { MESSAGES } from '../../../lib/messages';
import { ROUTES } from '../../../lib/routes';
import { useTodoFilterStore, type StatusFilter } from '../../../stores/todoFilterStore';
import { useCategories } from '../../categories';
import { useDeleteTodo, useTodos, useToggleTodo } from '../hooks';
import styles from './TodoList.module.css';

function Filters() {
  const { categoryId, status, setCategory, setStatus } = useTodoFilterStore();
  const categories = useCategories();
  const onStatus = (v: string) => setStatus(v ? (v as StatusFilter) : null);
  return (
    <div className={styles.filters}>
      <label className={styles.filter}>
        <span className={styles.filterLabel}>카테고리</span>
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : null)}
          className={styles.select}
        >
          <option value="">전체</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {/* 데스크톱: 세그먼트 라디오 / 모바일: 드롭다운(4번 문서 6장) */}
      <fieldset className={styles.segment}>
        <legend className={styles.filterLabel}>상태</legend>
        {[null, ...TODO_STATUSES].map((s) => (
          <label
            key={s ?? 'all'}
            className={styles.segmentItem}
            data-checked={status === s || undefined}
          >
            <input
              type="radio"
              name="status-filter"
              className="visually-hidden"
              checked={status === s}
              onChange={() => setStatus(s)}
            />
            {s ?? '전체'}
          </label>
        ))}
      </fieldset>
      <label className={`${styles.filter} ${styles.mobileOnly}`}>
        <span className={styles.filterLabel}>상태 선택</span>
        <select
          value={status ?? ''}
          onChange={(e) => onStatus(e.target.value)}
          className={styles.select}
        >
          <option value="">전체</option>
          {TODO_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

interface RowProps {
  todo: TodoWithStatus;
  categoryName?: string;
  today: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
}

function TodoRow({ todo, categoryName, today, checked, onToggle, onDelete }: RowProps) {
  const navigate = useNavigate();
  const edit = () => navigate(ROUTES.todoEdit(todo.id));
  return (
    <li className={styles.row}>
      <input
        type="checkbox"
        className={styles.toggle}
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`${todo.title} 완료`}
      />
      <button
        type="button"
        className={styles.titleLink}
        data-done={todo.isCompleted || undefined}
        onClick={edit}
      >
        {todo.title}
      </button>
      <span className={styles.category}>{categoryName}</span>
      <span className={styles.period}>
        {formatShort(todo.startDate, today)} ~ {formatShort(todo.endDate, today)}
      </span>
      <span className={styles.status}>
        <StatusBadge status={todo.status} />
      </span>
      <span className={styles.actions}>
        <Button size="sm" onClick={edit} aria-label={`${todo.title} 편집`}>
          편집
        </Button>
        <Button size="sm" onClick={onDelete} aria-label={`${todo.title} 삭제`}>
          삭제
        </Button>
      </span>
    </li>
  );
}

/** SC-05 할일 목록(SN-09~11). 상태는 서버 값을 표시만 한다(LP-13) */
export function TodoList() {
  const navigate = useNavigate();
  const { categoryId, status, page, setPage } = useTodoFilterStore();
  const today = todayLocal();
  const params = {
    today,
    ...(categoryId !== null && { categoryId }),
    ...(status !== null && { status }),
    page,
  };
  const todos = useTodos(params);
  const categories = useCategories();
  const toggle = useToggleTodo();
  const remove = useDeleteTodo();
  const [target, setTarget] = useState<TodoWithStatus | null>(null);

  const names = new Map(categories.data?.map((c) => [c.id, c.name]));
  const items = todos.data?.items ?? [];
  const totalPages = Math.ceil((todos.data?.totalCount ?? 0) / PAGE_SIZE);
  const isFiltered = categoryId !== null || status !== null;
  const actionError = todos.isError || toggle.isError || remove.isError ? MESSAGES.generic : null;

  const confirmDelete = () => {
    if (!target) return;
    remove.mutate(target.id, {
      onSuccess: () => {
        if (items.length === 1 && page > 1) setPage(page - 1); // 빈 페이지면 이전 페이지(WA-11)
      },
      onSettled: () => setTarget(null),
    });
  };

  const newButton = (
    <Button variant="primary" onClick={() => navigate(ROUTES.todoNew)}>
      + 새 할일
    </Button>
  );

  return (
    <div className={styles.wrap}>
      <ErrorBanner message={actionError} />
      <div className={styles.head}>
        <h1 className={styles.title}>할일 목록</h1>
        {newButton}
      </div>
      <Filters />
      <p className={styles.sort}>정렬: 종료일 빠른 순 (같으면 먼저 만든 순)</p>
      {todos.isPending ? (
        <p role="status">불러오는 중…</p>
      ) : items.length === 0 && !todos.isError ? (
        isFiltered || page > 1 ? (
          <EmptyState message="조건에 맞는 할일이 없습니다." />
        ) : (
          <EmptyState message="아직 등록한 할일이 없습니다. 첫 할일을 등록해 보세요.">
            {newButton}
          </EmptyState>
        )
      ) : (
        <ul className={styles.list} aria-label="할일">
          <li className={styles.header} aria-hidden="true">
            <span>완료</span>
            <span>제목</span>
            <span>카테고리</span>
            <span>기간</span>
            <span>상태</span>
            <span>작업</span>
          </li>
          {items.map((t) => (
            <TodoRow
              key={t.id}
              todo={t}
              categoryName={names.get(t.categoryId)}
              today={today}
              // 저장 중엔 누른 값, 실패하면 서버 값으로 돌아간다(WA-10)
              checked={
                toggle.isPending && toggle.variables.id === t.id
                  ? toggle.variables.isCompleted
                  : t.isCompleted
              }
              onToggle={(isCompleted) => toggle.mutate({ id: t.id, isCompleted })}
              onDelete={() => setTarget(t)}
            />
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      <ConfirmDialog
        open={target !== null}
        title="할일 삭제"
        message={<p>&apos;{target?.title}&apos;을(를) 삭제할까요? 삭제하면 복구할 수 없습니다.</p>}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
        isPending={remove.isPending}
      />
    </div>
  );
}
