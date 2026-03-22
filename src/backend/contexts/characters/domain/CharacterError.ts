import { AppError } from '@/backend/shared/domain/AppError';

export const CharacterErrorCodes = {
  CREATE_NAME_REQUIRED: 'character_error_create_name_required',
  UPDATE_NOT_FOUND: 'character_error_update_not_found',
  UPDATE_UNAUTHORIZED: 'character_error_update_unauthorized',
  UPDATE_SYSTEM_NOT_SUPPORTED: 'character_error_update_system_not_supported',
  DELETE_NOT_FOUND: 'character_error_delete_not_found',
  DELETE_UNAUTHORIZED: 'character_error_delete_unauthorized',
  GET_NOT_FOUND: 'character_error_get_not_found',
  GET_BY_OWNER_REQUIRED: 'character_error_get_by_owner_required',
  DOMAIN_ATTRIBUTE_BELOW_ONE: 'domain_error_attribute_below_one',
  DOMAIN_HP_MAX_BELOW_ONE: 'domain_error_hp_max_below_one',
  DOMAIN_HP_DAMAGE_NEGATIVE: 'domain_error_hp_damage_negative',
  DOMAIN_HP_HEALING_NEGATIVE: 'domain_error_hp_healing_negative',
} as const;

export type CharacterErrorCode = (typeof CharacterErrorCodes)[keyof typeof CharacterErrorCodes];

export class CharacterError extends AppError {
  constructor(code: CharacterErrorCode) {
    super(code);
    this.name = 'CharacterError';
  }
}
