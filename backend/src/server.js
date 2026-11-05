import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { pool } from './db/pool.js';
import { logger } from './lib/logger.js';

const env = loadEnv();
const server = createApp().listen(env.PORT, () =>
  logger.info({ port: env.PORT }, 'server started'),
);

function shutdown(signal) {
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
