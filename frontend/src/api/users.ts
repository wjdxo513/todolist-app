import { request } from './client';
import type { ChangePasswordRequest, User } from './types';

export const getMe = () => request<User>('/users/me');

export const updateMe = (body: { name: string }) =>
  request<User>('/users/me', { method: 'PATCH', body });

export const changePassword = (body: ChangePasswordRequest) =>
  request<void>('/users/me/password', { method: 'PUT', body });
