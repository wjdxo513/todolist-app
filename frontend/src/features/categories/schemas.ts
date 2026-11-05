import { z } from 'zod';
import { LIMITS } from '../../lib/limits';

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, `이름은 1~${LIMITS.CATEGORY_NAME_MAX}자로 입력해 주세요.`)
  .max(LIMITS.CATEGORY_NAME_MAX, `이름은 1~${LIMITS.CATEGORY_NAME_MAX}자로 입력해 주세요.`);
