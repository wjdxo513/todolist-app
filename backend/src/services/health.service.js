import { AppError } from '../lib/errors.js';
import * as healthRepository from '../repositories/health.repository.js';

export async function check() {
  try {
    await healthRepository.ping();
  } catch {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', '서비스를 일시적으로 사용할 수 없습니다.');
  }
  return { status: 'ok' };
}
