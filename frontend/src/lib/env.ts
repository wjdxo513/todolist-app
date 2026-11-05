// import.meta.env를 읽는 유일한 모듈(SP-01, LP-14)
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

/** 개발 서버(vite dev)에서만 true. 테스트(mode=test)와 운영 빌드에서는 false */
export const IS_DEV_LOGGING: boolean = import.meta.env.DEV && import.meta.env.MODE !== 'test';
