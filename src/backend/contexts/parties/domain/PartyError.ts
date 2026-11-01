import { AppError, AppErrorKind } from '@backend/shared/domain/AppError';

export const PartyErrorCodes = {
  NAME_INVALID: 'party_error_name_invalid',
  GM_LIMIT: 'party_error_gm_limit',
  NOT_FOUND: 'party_error_not_found',
  INVITE_NOT_FOUND: 'party_error_invite_not_found',
  USER_NOT_FOUND: 'party_error_user_not_found',
  GM_CANNOT_JOIN: 'party_error_gm_cannot_join',
  CHARACTER_NOT_ALLOWED: 'party_error_character_not_allowed',
} as const;

export type PartyErrorCode = (typeof PartyErrorCodes)[keyof typeof PartyErrorCodes];

// Codes not listed here are validation errors.
const ERROR_KINDS: Partial<Record<PartyErrorCode, AppErrorKind>> = {
  [PartyErrorCodes.NOT_FOUND]: 'not_found',
  [PartyErrorCodes.INVITE_NOT_FOUND]: 'not_found',
  [PartyErrorCodes.USER_NOT_FOUND]: 'not_found',
};

export class PartyError extends AppError {
  constructor(code: PartyErrorCode) {
    super(code, ERROR_KINDS[code]);
    this.name = 'PartyError';
  }
}
