import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', '찾을 수 없습니다.'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let body = { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' };
  if (err instanceof AppError) {
    status = err.status;
    body = { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) };
  } else if (err?.expose && err.status >= 400 && err.status < 500) {
    // body-parser의 클라이언트 오류(파싱 실패·크기 초과·charset 등)
    status = 400;
    body = { code: 'VALIDATION_ERROR', message: '입력값을 확인해 주세요.' };
  }
  if (status >= 500) {
    logger.error(
      { err, method: req.method, path: req.originalUrl, time: new Date().toISOString() },
      'request failed',
    );
  }
  res.status(status).json({ error: body });
}
