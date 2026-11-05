import { AppError } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import * as users from '../repositories/users.repository.js';

export const getMe = (userId) => users.findById(userId);

export const updateName = (userId, name) => users.updateName(userId, name);

export async function changePassword(userId, { currentPassword, newPassword }) {
  const row = await users.findAuthById(userId);
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    const msg = '현재 비밀번호가 일치하지 않습니다.';
    throw new AppError(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', {
      currentPassword: msg,
    });
  }
  await users.updatePasswordHash(userId, await hashPassword(newPassword));
}
