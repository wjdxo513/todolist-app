import { useRouteError } from 'react-router';
import { ErrorPanel } from '../components/ui/ErrorPanel';
import { logger } from '../lib/logger';

/** 라우트 렌더 중 예외(errorElement). 라우터 기본 개발자용 오류 화면 대신 표시 */
export function RouteError() {
  logger.error('app', '화면 렌더 오류', useRouteError());
  return <ErrorPanel />;
}
