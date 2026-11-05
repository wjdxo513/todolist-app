import { z } from 'zod';
import { LIMITS } from '../../lib/limits';

export const END_BEFORE_START = '종료일은 시작일보다 빠를 수 없습니다.';

// BR-04(필수), BR-05(종료일 ≥ 시작일, 같은 날 허용), AS-08(길이)
export const todoFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '제목을 입력해 주세요.')
      .max(LIMITS.TITLE_MAX, `제목은 1~${LIMITS.TITLE_MAX}자로 입력해 주세요.`),
    startDate: z.string().min(1, '시작일을 선택해 주세요.'),
    endDate: z.string().min(1, '종료일을 선택해 주세요.'),
    memo: z.string().max(LIMITS.MEMO_MAX, '메모는 1,000자 이하로 입력해 주세요.'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: END_BEFORE_START,
  });
