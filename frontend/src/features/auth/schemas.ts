import { z } from 'zod';
import { LIMITS } from '../../lib/limits';

// 클라이언트 검증은 UX용(CP-05). 문구는 4번 문서 4.1 예시를 따른다
export const passwordSchema = z
  .string()
  .min(LIMITS.PASSWORD_MIN, `비밀번호는 ${LIMITS.PASSWORD_MIN}자 이상이어야 합니다.`)
  .refine(
    (s) => new TextEncoder().encode(s).length <= LIMITS.PASSWORD_MAX_BYTES,
    '비밀번호가 너무 깁니다.',
  );

export const userNameSchema = z
  .string()
  .trim()
  .min(1, '이름을 입력해 주세요.')
  .max(LIMITS.USER_NAME_MAX, `이름은 1~${LIMITS.USER_NAME_MAX}자로 입력해 주세요.`);

export const signupSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  password: passwordSchema,
  name: userNameSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, '이메일을 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

export type FieldErrors = Record<string, string>;

/** zod 실패를 필드별 첫 문구로 */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    out[key] ??= issue.message;
  }
  return out;
}
