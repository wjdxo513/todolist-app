import { z } from 'zod';
import { LIMITS } from '../domain/limits.js';

export const categoryBody = z.object({
  name: z
    .string()
    .trim()
    .min(1, '카테고리 이름을 입력해 주세요.')
    .max(LIMITS.CATEGORY_NAME_MAX, `이름은 ${LIMITS.CATEGORY_NAME_MAX}자 이하여야 합니다.`),
});
