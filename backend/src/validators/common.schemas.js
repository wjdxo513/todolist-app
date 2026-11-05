import { z } from 'zod';
import { isValidDateString } from '../domain/dateString.js';

export const dateString = z.string().refine(isValidDateString, '날짜 형식이 올바르지 않습니다.');

export const todaySchema = z.object({ today: dateString });

export const idParams = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d{0,9}$/)
    .transform(Number)
    .refine((n) => n <= 2147483647), // int4 상한
});
