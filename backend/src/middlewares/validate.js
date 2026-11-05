import { AppError } from '../lib/errors.js';

function fieldsOf(error) {
  const fields = {};
  for (const issue of error.issues) fields[issue.path[0] ?? '_'] ??= issue.message;
  return fields;
}

export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    if (params) {
      const r = params.safeParse(req.params);
      if (!r.success) return next(new AppError(404, 'NOT_FOUND', '찾을 수 없습니다.'));
      req.params = r.data;
    }
    for (const [key, schema] of [
      ['body', body],
      ['query', query],
    ]) {
      if (!schema) continue;
      const r = schema.safeParse(req[key]);
      if (!r.success) {
        return next(
          new AppError(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', fieldsOf(r.error)),
        );
      }
      if (key === 'query') {
        // Express 5의 query는 getter라 직접 대입할 수 없다
        Object.defineProperty(req, 'query', {
          value: r.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } else {
        req.body = r.data;
      }
    }
    next();
  };
}
