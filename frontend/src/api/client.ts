// 단일 fetch 래퍼(LP-08). API 기준 URL을 쓰는 유일한 모듈(값은 lib/env.ts, SP-01).
import { API_BASE_URL as BASE_URL } from '../lib/env';
import { logger } from '../lib/logger';
import { MESSAGES } from '../lib/messages';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

type Query = Record<string, string | number | undefined | null>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function send(url: string, method: string, body: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    logger.error('api', `네트워크 실패 ${method} ${url}`, e);
    throw new ApiError(0, 'NETWORK_ERROR', MESSAGES.network);
  }
}

async function toError(res: Response): Promise<ApiError> {
  try {
    const { error } = (await res.json()) as {
      error: { code: string; message: string; fields?: Record<string, string> };
    };
    return new ApiError(res.status, error.code, error.message, error.fields);
  } catch {
    return new ApiError(res.status, 'UNKNOWN_ERROR', MESSAGES.generic);
  }
}

// single-flight: 진행 중인 갱신이 있으면 그 결과를 함께 기다린다. 끝나면 비워서 이후 401은 다시 갱신한다.
let refreshing: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  if (refreshing) {
    logger.debug('auth', '진행 중인 토큰 갱신을 기다림(single-flight)');
    return refreshing;
  }
  logger.info('auth', '토큰 갱신 시작');
  refreshing = send(buildUrl('/auth/refresh'), 'POST', undefined)
    .then((r) => {
      logger.info('auth', r.ok ? '토큰 갱신 성공' : `토큰 갱신 실패 ${r.status}`);
      return r.ok;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;
  const url = buildUrl(path, query);
  const label = `${method} ${url.slice(BASE_URL.length)}`; // 본문은 기록하지 않는다(비밀번호 등)
  const startedAt = performance.now();
  logger.debug('api', `→ ${label}`);
  let res = await send(url, method, body);

  // /auth/* 의 401(로그인 실패, 갱신 실패)은 갱신 대상이 아니다(LP-08, LP-09)
  if (res.status === 401 && !path.startsWith('/auth/')) {
    const original = await toError(res);
    if (original.code !== 'UNAUTHENTICATED' || !(await refreshOnce())) {
      logger.warn('api', `← ${label} 401 ${original.code}`);
      throw original;
    }
    logger.info('api', `↻ 갱신 후 재시도 ${label}`);
    res = await send(url, method, body); // 재시도는 한 번뿐. 다시 401이면 그대로 던진다
  }

  const ms = Math.round(performance.now() - startedAt);
  if (!res.ok) {
    const error = await toError(res);
    logger.warn('api', `← ${label} ${res.status} ${error.code} (${ms}ms)`, error.fields);
    throw error;
  }
  logger.debug('api', `← ${label} ${res.status} (${ms}ms)`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
