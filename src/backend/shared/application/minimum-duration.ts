/**
 * How long the e-mail forms (sign-up, magic link, password reset) take to answer at least.
 * They answer the same for registered and unknown e-mails, but the work behind differs (a new
 * account creates a user and sends a confirmation; an unknown e-mail on reset or magic link sends
 * nothing), so without a floor the response time would tell them apart.
 */
export const AUTH_EMAIL_MIN_DURATION_MS = 1500;

/** Runs `work` and, success or failure, answers no sooner than `ms` after it started. */
export async function withMinimumDuration<T>(ms: number, work: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    return await work();
  } finally {
    const remaining = ms - (Date.now() - startedAt);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
