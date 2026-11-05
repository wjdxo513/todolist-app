// 개발 모드 전용 콘솔 로거. 운영 빌드·테스트에서는 아무것도 출력하지 않는다.
// 비밀번호·이메일·요청 본문은 넘기지 않는다(호출하는 쪽 책임).
import { IS_DEV_LOGGING } from './env';

type Level = 'debug' | 'info' | 'warn' | 'error';
type LogFn = (scope: string, message: string, data?: unknown) => void;

const noop: LogFn = () => {};

export function createLogger(enabled: boolean): Record<Level, LogFn> {
  const make =
    (level: Level): LogFn =>
    (scope, message, data) => {
      const line = `[${scope}] ${message}`;
      if (data === undefined) console[level](line);
      else console[level](line, data);
    };
  return enabled
    ? { debug: make('debug'), info: make('info'), warn: make('warn'), error: make('error') }
    : { debug: noop, info: noop, warn: noop, error: noop };
}

export const logger = createLogger(IS_DEV_LOGGING);
