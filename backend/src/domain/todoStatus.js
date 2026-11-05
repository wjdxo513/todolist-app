export const STATUS = Object.freeze({
  NOT_STARTED: '시작 전',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  OVERDUE: '기한 초과',
});

export function deriveStatus({ startDate, endDate, isCompleted }, today) {
  if (isCompleted) return STATUS.DONE;
  if (today > endDate) return STATUS.OVERDUE;
  if (today < startDate) return STATUS.NOT_STARTED;
  return STATUS.IN_PROGRESS;
}

const checkParam = (p) => {
  if (typeof p !== 'string' || !/^\$[1-9]\d*$/.test(p)) throw new Error(`잘못된 자리표시자: ${p}`);
  return p;
};

export function statusCondition(status, todayParam) {
  const n = checkParam(todayParam);
  switch (status) {
    case STATUS.DONE:
      // 날짜와 무관하지만 네 상태 모두 같은 파라미터를 쓰게 해 호출부의 $n 개수를 고정한다
      return `is_completed AND ${n}::date IS NOT NULL`;
    case STATUS.OVERDUE:
      return `NOT is_completed AND end_date < ${n}::date`;
    case STATUS.NOT_STARTED:
      return `NOT is_completed AND start_date > ${n}::date`;
    case STATUS.IN_PROGRESS:
      return `NOT is_completed AND start_date <= ${n}::date AND end_date >= ${n}::date`;
    default:
      throw new Error(`알 수 없는 상태: ${status}`);
  }
}

export function overlapCondition(fromParam, toParam) {
  return `start_date <= ${checkParam(toParam)}::date AND end_date >= ${checkParam(fromParam)}::date`;
}
