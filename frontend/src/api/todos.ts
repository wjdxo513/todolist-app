import type { CalendarParams, TodoListParams } from '../lib/queryKeys';
import { request } from './client';
import type { Todo, TodoCreateRequest, TodoPage, TodoUpdateRequest, TodoWithStatus } from './types';

// 목록·캘린더는 today를 반드시 실어 보낸다(PA-06)
export const listTodos = (params: TodoListParams) =>
  request<TodoPage>('/todos', { query: { ...params } });

export const listCalendarTodos = async (params: CalendarParams) =>
  (await request<{ items: TodoWithStatus[] }>('/todos/calendar', { query: { ...params } })).items;

export const getTodo = (id: number) => request<Todo>(`/todos/${id}`);

export const createTodo = (body: TodoCreateRequest) =>
  request<Todo>('/todos', { method: 'POST', body });

export const updateTodo = (id: number, body: TodoUpdateRequest) =>
  request<Todo>(`/todos/${id}`, { method: 'PUT', body });

export const setTodoCompletion = (id: number, isCompleted: boolean) =>
  request<Todo>(`/todos/${id}/completion`, { method: 'PATCH', body: { isCompleted } });

export const deleteTodo = (id: number) => request<void>(`/todos/${id}`, { method: 'DELETE' });
