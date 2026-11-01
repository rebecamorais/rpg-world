import { AppError, AppErrorKind } from '@backend/shared/domain/AppError';

export const CombatErrorCodes = {
  NOT_FOUND: 'combat_error_not_found',
  EXISTS: 'combat_error_exists',
  EMPTY: 'combat_error_empty',
  NOT_YOUR_TURN: 'combat_error_not_your_turn',
  FULL: 'combat_error_full',
  CHARACTER_NOT_ALLOWED: 'combat_error_character_not_allowed',
} as const;

export type CombatErrorCode = (typeof CombatErrorCodes)[keyof typeof CombatErrorCodes];

// Codes not listed here are validation errors.
const ERROR_KINDS: Partial<Record<CombatErrorCode, AppErrorKind>> = {
  [CombatErrorCodes.NOT_FOUND]: 'not_found',
};

export class CombatError extends AppError {
  constructor(code: CombatErrorCode) {
    super(code, ERROR_KINDS[code]);
    this.name = 'CombatError';
  }
}
