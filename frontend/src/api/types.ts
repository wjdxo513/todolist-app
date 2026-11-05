// backend/swagger.yaml(PRE-02) 스키마
import type { DateString } from '../lib/date';

export type { DateString };

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  isDefault: boolean;
}

export const TODO_STATUSES = ['시작 전', '진행중', '완료', '기한 초과'] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export interface Todo {
  id: number;
  categoryId: number;
  title: string;
  memo: string | null;
  startDate: DateString;
  endDate: DateString;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoWithStatus extends Todo {
  status: TodoStatus;
}

export interface TodoPage {
  items: TodoWithStatus[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface LogInRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TodoCreateRequest {
  title: string;
  categoryId: number | null;
  startDate: DateString;
  endDate: DateString;
  memo?: string;
}

export interface TodoUpdateRequest extends TodoCreateRequest {
  isCompleted: boolean;
}
