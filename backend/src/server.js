import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { pool } from './db/pool.js';
import { logger } from './lib/logger.js';

const env = loadEnv();
const server = createApp().listen(env.PORT, () =>
  logger.info({ port: env.PORT }, 'server started'),
);

function shutdown(signal) {
  // 두 번째 신호(종류 무관)는 기본 동작인 즉시 종료로 둔다. pool.end() 이중 호출 방지.
  process.removeAllListeners('SIGTERM').removeAllListeners('SIGINT');
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await pool.end();
    logger.info('shutdown complete');
    process.exitCode = 0;
  });
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
