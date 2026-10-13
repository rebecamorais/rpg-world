import { describe, expect, it } from 'vitest';

import { APIError } from './api-client';
import { errorCodeOf, translateErrorCode } from './error-message';

const messages: Record<string, string> = {
  'errors.unknown': 'Unknown error',
  'errors.common_error_invalid_request': 'Invalid data',
  'errors.character_error_not_found': 'Character not found',
};

const t = Object.assign((key: string) => messages[key], {
  has: (key: string) => key in messages,
});

describe('translateErrorCode', () => {
  it('translates a known error code', () => {
    expect(translateErrorCode(t, 'common_error_invalid_request')).toBe('Invalid data');
  });

  it('falls back to the generic message for an unknown code', () => {
    expect(translateErrorCode(t, 'some_raw_backend_code')).toBe('Unknown error');
  });

  it('falls back to the generic message when there is no code', () => {
    expect(translateErrorCode(t, undefined)).toBe('Unknown error');
    expect(translateErrorCode(t, '')).toBe('Unknown error');
  });
});

describe('errorCodeOf', () => {
  it('reads the code carried by an APIError', () => {
    expect(errorCodeOf(new APIError('character_error_not_found', 404))).toBe(
      'character_error_not_found',
    );
  });

  it('returns nothing for values that are not errors', () => {
    expect(errorCodeOf('boom')).toBeUndefined();
    expect(errorCodeOf(null)).toBeUndefined();
  });
});

describe('errorCodeOf + translateErrorCode', () => {
  it('never shows the raw message of an unexpected error', () => {
    const err = new TypeError('Failed to fetch');
    expect(translateErrorCode(t, errorCodeOf(err))).toBe('Unknown error');
  });
});
