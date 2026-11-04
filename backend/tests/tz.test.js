import { expect, it } from 'vitest';

// TP-06: 테스트는 비UTC 타임존에서 실행된다.
it('process.env.TZ가 UTC가 아니다', () => {
  expect(['UTC', 'Etc/UTC', '', undefined]).not.toContain(process.env.TZ);
  expect(new Date(2026, 0, 1).getTimezoneOffset()).not.toBe(0);
});
