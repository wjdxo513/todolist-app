import { z } from 'zod';
import { newPassword, userName } from './auth.schemas.js';

export const updateMeBody = z.object({ name: userName });
export const changePasswordBody = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
  newPassword,
});
