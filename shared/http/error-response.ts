import { AppError, AppErrorKind } from '@backend/shared/domain/AppError';

import { InvalidRequestError, ValidationIssue } from './validation';

const STATUS_BY_KIND: Record<AppErrorKind, number> = {
  validation: 400,
  not_found: 404,
  forbidden: 403,
};

export interface HttpError {
  status: number;
  body: { error: string; issues?: ValidationIssue[] };
}

/** Translates an error thrown by a use case into an HTTP status and response body. */
export function errorToHttp(err: unknown): HttpError {
  if (err instanceof InvalidRequestError) {
    return { status: 400, body: { error: err.code, issues: err.issues } };
  }

  if (err instanceof AppError) {
    return { status: STATUS_BY_KIND[err.kind], body: { error: err.code } };
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  const status = (err as { status?: number } | null)?.status ?? 400;
  return { status, body: { error: message } };
}
