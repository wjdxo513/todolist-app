import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

const SECRET = 'S3cr3t-value-XYZ';

function capture(obj) {
  const lines = [];
  createLogger({ write: (s) => lines.push(s) }, 'info').info(obj, 'test');
  return lines.join('');
}

describe('logger redact (SP-09, NFR-05)', () => {
  const cases = {
    password: { password: SECRET },
    'user.password': { user: { password: SECRET } },
    currentPassword: { currentPassword: SECRET },
    newPassword: { newPassword: SECRET },
    token: { token: SECRET },
    'body.token': { body: { token: SECRET } },
    accessToken: { accessToken: SECRET },
    refreshToken: { refreshToken: SECRET },
    'req.headers.authorization': { req: { headers: { authorization: SECRET } } },
    'req.headers.cookie': { req: { headers: { cookie: SECRET } } },
    'res.headers set-cookie': { res: { headers: { 'set-cookie': [SECRET] } } },
    'headers.authorization': { headers: { authorization: SECRET } },
    'headers.cookie': { headers: { cookie: SECRET } },
    'headers set-cookie': { headers: { 'set-cookie': [SECRET] } },
  };

  it.each(Object.entries(cases))('%s 원값이 출력에 없다', (_name, obj) => {
    const out = capture(obj);
    expect(out).not.toContain(SECRET);
    expect(out).toContain('[REDACTED]');
  });
});
