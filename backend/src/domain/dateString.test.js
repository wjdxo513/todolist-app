import { describe, expect, it } from 'vitest';
import { compareDateStrings, isValidDateString } from './dateString.js';

describe('isValidDateString (NP-19)', () => {
  it.each([
    '2026-02-30',
    '2026-13-01',
    '2026-1-1',
    '',
    '2025-02-29',
    null,
    undefined,
    20260301,
    {},
  ])('%j 는 무효', (v) => expect(isValidDateString(v)).toBe(false));
  it.each(['2024-02-29', '2026-03-01', '2026-12-31'])('%s 는 유효', (v) =>
    expect(isValidDateString(v)).toBe(true),
  );
});

describe('compareDateStrings', () => {
  it('-1/0/1', () => {
    expect(compareDateStrings('2026-03-01', '2026-03-02')).toBe(-1);
    expect(compareDateStrings('2026-03-01', '2026-03-01')).toBe(0);
    expect(compareDateStrings('2027-01-01', '2026-12-31')).toBe(1);
  });
});
