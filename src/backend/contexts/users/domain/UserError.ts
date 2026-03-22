import { AppError } from '@/backend/shared/domain/AppError';

export const UserErrorCodes = {
  SIGNUP_REQUIRED_FIELDS: 'auth_error_signup_required_fields',
  SIGNUP_INVALID_PASSWORD: 'auth_error_signup_invalid_password',
  SIGNUP_DUPLICATE_EMAIL: 'auth_error_signup_duplicate_email',
  AUTH_CODE_REQUIRED: 'auth_error_code_required',
  SIGNIN_REQUIRED_FIELDS: 'auth_error_signin_required_fields',
  SIGNIN_MAGIC_LINK_EMAIL_REQUIRED: 'auth_error_signin_magic_link_email_required',
  UPDATE_PASSWORD_REQUIRED: 'auth_error_update_password_required',
  PROFILE_UPDATE_ID_REQUIRED: 'profile_error_update_id_required',
  PROFILE_GET_ID_REQUIRED: 'profile_error_get_id_required',
  AVATAR_UPLOAD_USERID_REQUIRED: 'storage_error_upload_avatar_userid_required',
  AVATAR_UPLOAD_SIZE_LIMIT: 'storage_error_upload_avatar_size_limit',
  AVATAR_UPLOAD_INVALID_TYPE: 'storage_error_upload_avatar_invalid_type',
} as const;

export type UserErrorCode = (typeof UserErrorCodes)[keyof typeof UserErrorCodes];

export class UserError extends AppError {
  constructor(code: UserErrorCode) {
    super(code);
    this.name = 'UserError';
  }
}
