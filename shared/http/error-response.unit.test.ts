import { describe, expect, it } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';

import { errorToHttp } from './error-response';

describe('errorToHttp', () => {
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

  it('respeita status explícito em erros legados', () => {
    const error = Object.assign(new Error('Not found'), { status: 404 });
    expect(errorToHttp(error)).toEqual({ status: 404, body: { error: 'Not found' } });
  });

  it('usa 400 para erros genéricos', () => {
    expect(errorToHttp(new Error('boom'))).toEqual({ status: 400, body: { error: 'boom' } });
  });

  it('trata valores que não são Error', () => {
    expect(errorToHttp('x')).toEqual({ status: 400, body: { error: 'Unknown error' } });
  });
});
