import { request } from './client';
import type { Category } from './types';

export const listCategories = async () =>
  (await request<{ items: Category[] }>('/categories')).items;

export const createCategory = (name: string) =>
  request<Category>('/categories', { method: 'POST', body: { name } });

export const renameCategory = (id: number, name: string) =>
  request<Category>(`/categories/${id}`, { method: 'PATCH', body: { name } });

export const deleteCategory = (id: number) =>
  request<void>(`/categories/${id}`, { method: 'DELETE' });
