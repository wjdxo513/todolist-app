// 여러 화면이 같이 쓰는 문구(4번 문서 5.4~5.7, WA-03, WA-21)
export const MESSAGES = {
  generic: '처리하지 못했습니다. 다시 시도해 주세요.',
  network: '서버에 연결하지 못했습니다. 다시 시도해 주세요.',
  invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
  tooManyAttempts: '로그인 시도가 5회 실패했습니다. 5분 후 다시 시도해 주세요.',
  sessionExpired: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  signedUp: '가입이 완료되었습니다. 로그인해 주세요.',
  logoutFailed: '로그아웃에 실패했습니다. 다시 시도해 주세요.',
} as const;
