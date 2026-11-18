import { afterEach, describe, expect, it, vi } from 'vitest';

import { APIError } from './api-client';
import {
  NETWORK_ERROR,
  errorCodeOf,
  isClientError,
  isNetworkError,
  isRetryable,
  retryQuery,
  statusOf,
  translateErrorCode,
} from './error-message';

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

describe('isRetryable', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('a request that never got an answer can work next time', () => {
    expect(isRetryable(new TypeError('Failed to fetch'))).toBe(true);
  });

  it.each([500, 502, 503])('the server failing (%i) can work next time', (status) => {
    expect(isRetryable(new APIError('common_error_unexpected', status))).toBe(true);
  });

  it.each([408, 429])('an answer asking to wait (%i) can work next time', (status) => {
    expect(isRetryable(new APIError('common_error_rate_limited', status))).toBe(true);
  });

  it.each([400, 403, 404, 409])('an answer that would come back the same (%i) is not', (status) => {
    expect(isRetryable(new APIError('character_error_conflict', status))).toBe(false);
  });

  it('nor an error with no answer and no connection problem', () => {
    expect(isRetryable(new Error('boom'))).toBe(false);
    expect(isRetryable(undefined)).toBe(false);
  });
});

describe('statusOf', () => {
  it('reads the status of an answer, and nothing for other errors', () => {
    expect(statusOf(new APIError('x', 404))).toBe(404);
    expect(statusOf(new TypeError('Failed to fetch'))).toBeUndefined();
    expect(statusOf('boom')).toBeUndefined();
  });
});

describe('isClientError', () => {
  it.each([400, 401, 403, 404, 409])('a "no" from the server (%i) is', (status) => {
    expect(isClientError(new APIError('x', status))).toBe(true);
  });

  it.each([408, 429, 500])('"not now" or a server failure (%i) is not', (status) => {
    expect(isClientError(new APIError('x', status))).toBe(false);
  });

  it('nor an error without an answer', () => {
    expect(isClientError(new TypeError('Failed to fetch'))).toBe(false);
  });
});

describe('retryQuery', () => {
  it('opening a character that is not yours (404) is not tried again', () => {
    expect(retryQuery(0, new APIError('character_error_not_found', 404))).toBe(false);
  });

  it('a server failure or a lost connection is tried up to 3 more times', () => {
    const failed = new APIError('common_error_unexpected', 500);
    expect(retryQuery(0, failed)).toBe(true);
    expect(retryQuery(2, new TypeError('Failed to fetch'))).toBe(true);
    expect(retryQuery(3, failed)).toBe(false);
  });
});
