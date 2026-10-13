import { z } from 'zod';

import { AppError } from '@backend/shared/domain/AppError';

export const INVALID_REQUEST = 'common_error_invalid_request';

export interface ValidationIssue {
  path: string;
  message: string;
}

export class InvalidRequestError extends AppError {
  constructor(public readonly issues: ValidationIssue[]) {
    super(INVALID_REQUEST, 'validation');
    this.name = 'InvalidRequestError';
  }
}

/**
 * Validates untrusted input (request body, params, query, server action args) at the boundary.
 * Unknown object keys are stripped, so only declared fields reach the use cases.
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new InvalidRequestError(
      result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }

  return result.data;
}

/**
 * Optional field that also accepts `null` (stored values come back as null and the frontend
 * sends them back unchanged); both are normalized to `undefined`, meaning "not provided".
 */
export const optional = <S extends z.ZodType>(schema: S) =>
  schema.nullish().transform((value) => value ?? undefined);

/** Same as `optional`, but an empty string also counts as "not provided" (query strings). */
export const optionalQuery = <S extends z.ZodType>(schema: S) =>
  z.preprocess((value) => (value === '' ? undefined : value), optional(schema));

export const uuidParamsSchema = z.object({ id: z.uuid() });

/** http(s) URL or empty string (field cleared). Rejects schemes like `javascript:` or `data:`. */
export const httpUrlOrEmpty = z.union([z.url({ protocol: /^https?$/ }).max(2048), z.literal('')]);
