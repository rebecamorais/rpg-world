import { AppError, AppErrorKind } from '@backend/shared/domain/AppError';

import { InvalidRequestError, ValidationIssue } from './validation';

export const UNEXPECTED_ERROR = 'common_error_unexpected';

const STATUS_BY_KIND: Record<AppErrorKind, number> = {
  validation: 400,
  not_found: 404,
  forbidden: 403,
};

export interface HttpError {
  status: number;
  body: { error: string; issues?: ValidationIssue[] };
}

/**
 * Translates an error thrown by a use case into an HTTP status and response body.
 * Anything that is not an AppError is a bug or an infrastructure failure: it is logged and
 * answered as a generic 500, so database or provider messages never reach the client.
 */
export function errorToHttp(err: unknown): HttpError {
  if (err instanceof InvalidRequestError) {
    return { status: 400, body: { error: err.code, issues: err.issues } };
  }

  if (err instanceof AppError) {
    return { status: STATUS_BY_KIND[err.kind], body: { error: err.code } };
  }

  console.error('Unexpected error while handling request:', err);
  return { status: 500, body: { error: UNEXPECTED_ERROR } };
}

/** Error code safe to return to the client, e.g. from a server action. */
export function errorCode(err: unknown): string {
  return errorToHttp(err).body.error;
}
