import { AppError } from '@backend/shared/domain/AppError';

export const LoreErrorCodes = {
  CHARACTER_NOT_FOUND: 'lore_error_character_not_found',
} as const;

export type LoreErrorCode = (typeof LoreErrorCodes)[keyof typeof LoreErrorCodes];

export class LoreError extends AppError {
  constructor(code: LoreErrorCode) {
    super(code, 'not_found');
    this.name = 'LoreError';
  }
}
