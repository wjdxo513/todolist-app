import { request } from './client';
import type { LogInRequest, SignUpRequest, User } from './types';

export const signUp = (body: SignUpRequest) =>
  request<User>('/auth/signup', { method: 'POST', body });

export const logIn = (body: LogInRequest) => request<User>('/auth/login', { method: 'POST', body });

export const logOut = () => request<void>('/auth/logout', { method: 'POST' });
