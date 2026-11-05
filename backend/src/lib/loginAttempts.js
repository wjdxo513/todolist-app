export function createLoginAttempts({
  now = () => Date.now(),
  maxFailures = 5,
  blockMs = 300000,
  maxEntries = 10000,
} = {}) {
  const entries = new Map(); // email -> { count, lastFailAt, blockedUntil }
  const norm = (email) => email.trim().toLowerCase();
  const expired = (e) =>
    e.blockedUntil ? now() >= e.blockedUntil : now() - e.lastFailAt >= blockMs;

  function get(key) {
    const e = entries.get(key);
    if (e && expired(e)) {
      entries.delete(key);
      return undefined;
    }
    return e;
  }

  return {
    isBlocked: (email) => Boolean(get(norm(email))?.blockedUntil),
    recordFailure(email) {
      const key = norm(email);
      let e = get(key);
      if (!e) {
        if (entries.size >= maxEntries) {
          for (const [k, v] of entries) if (expired(v)) entries.delete(k);
        }
        e = { count: 0 };
        entries.set(key, e);
      }
      if (e.blockedUntil) return; // 차단 중에는 집계·연장 없음
      e.count += 1;
      e.lastFailAt = now();
      if (e.count >= maxFailures) e.blockedUntil = now() + blockMs;
    },
    reset: (email) => void entries.delete(norm(email)),
    clear: () => entries.clear(),
    size: () => entries.size,
  };
}

export const loginAttempts = createLoginAttempts();
