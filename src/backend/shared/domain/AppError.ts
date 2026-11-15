// What went wrong, independent of transport. The HTTP layer maps each kind to a status code.
export type AppErrorKind = 'validation' | 'not_found' | 'forbidden' | 'rate_limited' | 'conflict';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly kind: AppErrorKind = 'validation',
    /** Extra fields for the client, next to `error` (e.g. the current revision on a conflict). */
    public readonly details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = 'AppError';
  }
}
