import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';

import { UNEXPECTED_ERROR, errorCode, errorToHttp } from './error-response';

describe('errorToHttp', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['validation', 400],
    ['not_found', 404],
    ['forbidden', 403],
  ] as const)('mapeia AppError %s para %i com o código', (kind, status) => {
    expect(errorToHttp(new AppError('some_code', kind))).toEqual({
      status,
      body: { error: 'some_code' },
    });
  });

  it('responde 500 genérico para erros inesperados, sem vazar a mensagem', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Failed to save character: duplicate key value violates "pk"');

    expect(errorToHttp(error)).toEqual({ status: 500, body: { error: UNEXPECTED_ERROR } });
    expect(log).toHaveBeenCalledWith(expect.any(String), error);
  });

  it('trata valores que não são Error como inesperados', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(errorToHttp('x')).toEqual({ status: 500, body: { error: UNEXPECTED_ERROR } });
  });
});

describe('errorCode', () => {
  it('expõe o código de AppError e esconde erros inesperados', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(errorCode(new AppError('auth_error_x'))).toBe('auth_error_x');
    expect(errorCode(new Error('db exploded'))).toBe(UNEXPECTED_ERROR);
    vi.restoreAllMocks();
  });
});
