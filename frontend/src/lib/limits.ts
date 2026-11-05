// AS-08 길이 상수(LP-14). 백엔드 domain/limits.js와 같은 값을 각자 둔다. 불일치 시 서버가 정답(PP-20).
export const LIMITS = {
  TITLE_MAX: 100,
  MEMO_MAX: 1000,
  CATEGORY_NAME_MAX: 20,
  USER_NAME_MAX: 50,
  PASSWORD_MIN: 8,
  PASSWORD_MAX_BYTES: 72,
} as const;

export const PAGE_SIZE = 50;

/** 월·주 뷰에서 한 날짜에 보이는 막대 수 한도. 넘으면 [+N건](WA-18, D-14) */
export const CALENDAR_BAR_LIMIT = 3;
