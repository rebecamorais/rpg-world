import { afterEach, describe, expect, it, vi } from 'vitest';

import { APIError } from './api-client';
import { NETWORK_ERROR, errorCodeOf, isNetworkError, translateErrorCode } from './error-message';

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

describe('isNetworkError', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed'])(
    'recognizes the TypeError fetch throws when the request never left (%s)',
    (message) => {
      expect(isNetworkError(new TypeError(message))).toBe(true);
      expect(errorCodeOf(new TypeError(message))).toBe(NETWORK_ERROR);
    },
  );

  it('counts any thrown error while the browser is offline', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(isNetworkError(new Error('aborted'))).toBe(true);
  });

  it('never counts an answer from the server, even while offline', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(isNetworkError(new APIError('character_error_not_found', 404))).toBe(false);
  });

  it('does not count other errors', () => {
    expect(isNetworkError(new TypeError('x is not a function'))).toBe(false);
    expect(isNetworkError('Failed to fetch')).toBe(false);
  });
});

describe('errorCodeOf + translateErrorCode', () => {
  it('never shows the raw message of an unexpected error', () => {
    const err = new TypeError('x is not a function');
    expect(translateErrorCode(t, errorCodeOf(err))).toBe('Unknown error');
  });
});
