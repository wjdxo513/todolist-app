import { z } from 'zod';
import { LIMITS } from '../domain/limits.js';
import { STATUS } from '../domain/todoStatus.js';
import { dateString } from './common.schemas.js';

const fields = {
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해 주세요.')
    .max(LIMITS.TITLE_MAX, `제목은 ${LIMITS.TITLE_MAX}자 이하여야 합니다.`),
  categoryId: z.number().int().min(1).max(2147483647).nullish(),
  memo: z.string().max(LIMITS.MEMO_MAX, `메모는 ${LIMITS.MEMO_MAX}자 이하여야 합니다.`).nullish(),
  startDate: dateString,
  endDate: dateString,
};

const orderedDates = [
  (b) => b.endDate >= b.startDate,
  { message: '종료일은 시작일보다 빠를 수 없습니다.', path: ['endDate'] },
];

export const todoCreateBody = z.object(fields).refine(...orderedDates);
export const todoUpdateBody = z
  .object({ ...fields, isCompleted: z.boolean() })
  .refine(...orderedDates);
export const completionBody = z.object({ isCompleted: z.boolean() });

const positiveInt = z
  .string()
  .regex(/^[1-9]\d{0,9}$/)
  .transform(Number)
  .refine((n) => n <= 2147483647);

export const listQuery = z.object({
  today: dateString,
  categoryId: positiveInt.optional(),
  status: z.enum(Object.values(STATUS)).optional(),
  page: positiveInt.default(1),
});

const utcDay = (s) => Date.parse(`${s}T00:00:00Z`) / 86400000;
const MAX_CALENDAR_DAYS = 42;

export const calendarQuery = z
  .object({ from: dateString, to: dateString, today: dateString })
  .refine((q) => q.from <= q.to, { message: 'from은 to보다 늦을 수 없습니다.', path: ['to'] })
  .refine((q) => utcDay(q.to) - utcDay(q.from) < MAX_CALENDAR_DAYS, {
    message: `조회 범위는 ${MAX_CALENDAR_DAYS}일 이하여야 합니다.`,
    path: ['to'],
  });
