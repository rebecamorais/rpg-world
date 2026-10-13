// What went wrong, independent of transport. The HTTP layer maps each kind to a status code.
export type AppErrorKind = 'validation' | 'not_found' | 'forbidden';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly kind: AppErrorKind = 'validation',
  ) {
    super(code);
    this.name = 'AppError';
  }
}
