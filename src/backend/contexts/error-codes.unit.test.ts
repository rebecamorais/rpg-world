import { describe, expect, it } from 'vitest';

import { UNEXPECTED_ERROR } from '@shared/http/error-response';
import { INVALID_REQUEST } from '@shared/http/validation';

import en from '../../../messages/en.json';
import pt from '../../../messages/pt.json';
import { CharacterErrorCodes } from './characters/domain/CharacterError';
import { FeedbackErrorCodes } from './feedback/domain/FeedbackError';
import { LoreErrorCodes } from './lore/domain/LoreError';
import { PartyErrorCodes } from './parties/domain/PartyError';
import { UserErrorCodes } from './users/domain/UserError';

// Every code the backend can send to the client is shown through `common.errors.<code>`;
// a missing key falls back to the generic message, hiding what went wrong.
const CODES = [
  ...Object.values(CharacterErrorCodes),
  ...Object.values(FeedbackErrorCodes),
  ...Object.values(LoreErrorCodes),
  ...Object.values(PartyErrorCodes),
  ...Object.values(UserErrorCodes),
  INVALID_REQUEST,
  UNEXPECTED_ERROR,
];

describe('códigos de erro', () => {
  it.each([
    ['en', en.common.errors],
    ['pt', pt.common.errors],
  ])('todos têm tradução em %s', (_locale, errors) => {
    const missing = CODES.filter((code) => !(code in errors));
    expect(missing).toEqual([]);
  });
});
