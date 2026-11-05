import pino from 'pino';
import { loadEnv } from '../config/env.js';

const secrets = [
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
];

export function createLogger(destination, level = loadEnv().LOG_LEVEL) {
  return pino(
    {
      level,
      redact: {
        paths: [
          ...secrets,
          ...secrets.map((k) => `*.${k}`),
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'headers.authorization',
          'headers.cookie',
          'headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
    },
    destination,
  );
}

export const logger = createLogger();
