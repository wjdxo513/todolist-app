import { describe, expect, it } from 'vitest';
import { useSessionStore } from './sessionStore';

describe('sessionStore (WA-21)', () => {
  it('만료 안내 플래그를 켜고 끈다', () => {
    expect(useSessionStore.getState().isExpired).toBe(false);
    useSessionStore.getState().setExpired(true);
    expect(useSessionStore.getState().isExpired).toBe(true);
    useSessionStore.getState().setExpired(false);
    expect(useSessionStore.getState().isExpired).toBe(false);
  });
});
