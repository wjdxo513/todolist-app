import { afterEach, describe, expect, it, vi } from 'vitest';
import { IS_DEV_LOGGING } from './env';
import { createLogger, logger } from './logger';

afterEach(() => vi.restoreAllMocks());

describe('logger', () => {
  it('켜져 있으면 [scope] 접두와 데이터를 해당 레벨로 출력한다', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger(true);
    log.info('api', 'GET /todos');
    log.error('api', '실패', { status: 500 });
    expect(info).toHaveBeenCalledWith('[api] GET /todos');
    expect(error).toHaveBeenCalledWith('[api] 실패', { status: 500 });
  });

  it('꺼져 있으면 아무것도 출력하지 않는다', () => {
    const spies = (['debug', 'info', 'warn', 'error'] as const).map((l) =>
      vi.spyOn(console, l).mockImplementation(() => {}),
    );
    const log = createLogger(false);
    log.debug('a', 'b');
    log.info('a', 'b');
    log.warn('a', 'b', 1);
    log.error('a', 'b');
    for (const s of spies) expect(s).not.toHaveBeenCalled();
  });

  it('테스트(mode=test)에서는 기본 logger가 꺼져 있다(개발 서버에서만 출력)', () => {
    expect(IS_DEV_LOGGING).toBe(false);
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('x', 'y');
    expect(info).not.toHaveBeenCalled();
  });
});
