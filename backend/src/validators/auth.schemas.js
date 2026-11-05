import { z } from 'zod';
import { LIMITS } from '../domain/limits.js';

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(LIMITS.EMAIL_MAX, '이메일이 너무 깁니다.')
  .pipe(z.email('이메일 형식이 올바르지 않습니다.'));
export const newPassword = z
  .string()
  .min(LIMITS.PASSWORD_MIN, `비밀번호는 ${LIMITS.PASSWORD_MIN}자 이상이어야 합니다.`)
  // bcrypt는 72바이트 이후를 무시한다
  .refine((s) => Buffer.byteLength(s) <= LIMITS.PASSWORD_MAX_BYTES, '비밀번호가 너무 깁니다.');
export const userName = z
  .string()
  .trim()
  .min(1, '이름을 입력해 주세요.')
  .max(LIMITS.USER_NAME_MAX, `이름은 ${LIMITS.USER_NAME_MAX}자 이하여야 합니다.`);

export const signupBody = z.object({ email, password: newPassword, name: userName });
export const loginBody = z.object({
  email,
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});
