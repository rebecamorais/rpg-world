import { AppError, AppErrorKind } from '@backend/shared/domain/AppError';

const STATUS_BY_KIND: Record<AppErrorKind, number> = {
  validation: 400,
  not_found: 404,
  forbidden: 403,
};

export interface HttpError {
  status: number;
  body: { error: string };
}

/** Translates an error thrown by a use case into an HTTP status and response body. */
export function errorToHttp(err: unknown): HttpError {
  if (err instanceof AppError) {
    return { status: STATUS_BY_KIND[err.kind], body: { error: err.code } };
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  const status = (err as { status?: number } | null)?.status ?? 400;
  return { status, body: { error: message } };
}
