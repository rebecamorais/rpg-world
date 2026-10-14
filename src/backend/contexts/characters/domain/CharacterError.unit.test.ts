import { describe, expect, it } from 'vitest';

import { errorToHttp } from '@shared/http/error-response';

import { CharacterError, CharacterErrorCodes } from './CharacterError';

describe('CharacterError', () => {
  it.each([
    [CharacterErrorCodes.UPDATE_NOT_FOUND, 404],
    [CharacterErrorCodes.DELETE_NOT_FOUND, 404],
    [CharacterErrorCodes.GET_NOT_FOUND, 404],
    [CharacterErrorCodes.ACCESS_NOT_FOUND, 404],
    [CharacterErrorCodes.UPDATE_UNAUTHORIZED, 403],
    [CharacterErrorCodes.DELETE_UNAUTHORIZED, 403],
    [CharacterErrorCodes.ACCESS_FORBIDDEN, 403],
    [CharacterErrorCodes.CREATE_NAME_REQUIRED, 400],
    [CharacterErrorCodes.DOMAIN_HP_MAX_BELOW_ONE, 400],
  ])('%s responde %i', (code, status) => {
    expect(errorToHttp(new CharacterError(code))).toEqual({ status, body: { error: code } });
  });

  it('identifica a classe do erro', () => {
    expect(new CharacterError(CharacterErrorCodes.GET_NOT_FOUND).name).toBe('CharacterError');
  });
});
