import { AppError, AppErrorKind } from '@backend/shared/domain/AppError';

export const CharacterErrorCodes = {
  CREATE_NAME_REQUIRED: 'character_error_create_name_required',
  UPDATE_NOT_FOUND: 'character_error_update_not_found',
  UPDATE_UNAUTHORIZED: 'character_error_update_unauthorized',
  UPDATE_SYSTEM_NOT_SUPPORTED: 'character_error_update_system_not_supported',
  DELETE_NOT_FOUND: 'character_error_delete_not_found',
  DELETE_UNAUTHORIZED: 'character_error_delete_unauthorized',
  GET_NOT_FOUND: 'character_error_get_not_found',
  GET_BY_OWNER_REQUIRED: 'character_error_get_by_owner_required',
  ACCESS_NOT_FOUND: 'character_error_not_found',
  ACCESS_FORBIDDEN: 'character_error_forbidden',
  AVATAR_FILE_TOO_LARGE: 'character_error_avatar_file_too_large',
  AVATAR_INVALID_TYPE: 'character_error_avatar_invalid_type',
  SPELL_ACTION_INVALID: 'character_error_spell_action_invalid',
  DOMAIN_ATTRIBUTE_BELOW_ONE: 'domain_error_attribute_below_one',
  DOMAIN_HP_MAX_BELOW_ONE: 'domain_error_hp_max_below_one',
  DOMAIN_HP_DAMAGE_NEGATIVE: 'domain_error_hp_damage_negative',
  DOMAIN_HP_HEALING_NEGATIVE: 'domain_error_hp_healing_negative',
} as const;

export type CharacterErrorCode = (typeof CharacterErrorCodes)[keyof typeof CharacterErrorCodes];

// Codes not listed here are validation errors.
const ERROR_KINDS: Partial<Record<CharacterErrorCode, AppErrorKind>> = {
  [CharacterErrorCodes.UPDATE_NOT_FOUND]: 'not_found',
  [CharacterErrorCodes.DELETE_NOT_FOUND]: 'not_found',
  [CharacterErrorCodes.GET_NOT_FOUND]: 'not_found',
  [CharacterErrorCodes.ACCESS_NOT_FOUND]: 'not_found',
  [CharacterErrorCodes.UPDATE_UNAUTHORIZED]: 'forbidden',
  [CharacterErrorCodes.DELETE_UNAUTHORIZED]: 'forbidden',
  [CharacterErrorCodes.ACCESS_FORBIDDEN]: 'forbidden',
};

export class CharacterError extends AppError {
  constructor(code: CharacterErrorCode) {
    super(code, ERROR_KINDS[code]);
    this.name = 'CharacterError';
  }
}
