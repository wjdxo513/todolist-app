export const isUniqueViolation = (err, constraint) =>
  err?.code === '23505' && err.constraint === constraint;
