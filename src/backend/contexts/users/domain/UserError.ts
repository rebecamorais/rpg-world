import { AppError, AppErrorKind } from '@backend/shared/domain/AppError';

export const UserErrorCodes = {
  SIGNUP_REQUIRED_FIELDS: 'auth_error_signup_required_fields',
  SIGNUP_INVALID_PASSWORD: 'auth_error_signup_invalid_password',
  SIGNUP_DUPLICATE_EMAIL: 'auth_error_signup_duplicate_email',
  AUTH_CODE_REQUIRED: 'auth_error_code_required',
  AUTH_LINK_EXPIRED: 'auth_error_link_expired',
  AUTH_PROVIDER_ERROR: 'auth_error_provider',
  AUTH_RATE_LIMITED: 'auth_error_rate_limited',
  AUTH_USER_NOT_FOUND: 'auth_error_user_not_found',
  SIGNIN_REQUIRED_FIELDS: 'auth_error_signin_required_fields',
  SIGNIN_INVALID_CREDENTIALS: 'auth_error_signin_invalid_credentials',
  SIGNIN_EMAIL_NOT_CONFIRMED: 'auth_error_signin_email_not_confirmed',
  SIGNIN_MAGIC_LINK_EMAIL_REQUIRED: 'auth_error_signin_magic_link_email_required',
  UPDATE_PASSWORD_REQUIRED: 'auth_error_update_password_required',
  UPDATE_PASSWORD_WEAK: 'auth_error_update_password_weak',
  UPDATE_PASSWORD_SAME: 'auth_error_update_password_same',
  PROFILE_UPDATE_ID_REQUIRED: 'profile_error_update_id_required',
  PROFILE_GET_ID_REQUIRED: 'profile_error_get_id_required',
  PROFILE_USERNAME_TAKEN: 'profile_error_username_taken',
  AVATAR_UPLOAD_USERID_REQUIRED: 'storage_error_upload_avatar_userid_required',
  AVATAR_UPLOAD_SIZE_LIMIT: 'storage_error_upload_avatar_size_limit',
  AVATAR_UPLOAD_INVALID_TYPE: 'storage_error_upload_avatar_invalid_type',
} as const;

export type UserErrorCode = (typeof UserErrorCodes)[keyof typeof UserErrorCodes];

// Codes not listed here are validation errors.
const ERROR_KINDS: Partial<Record<UserErrorCode, AppErrorKind>> = {
  [UserErrorCodes.AUTH_USER_NOT_FOUND]: 'not_found',
};

export class UserError extends AppError {
  constructor(code: UserErrorCode) {
    super(code, ERROR_KINDS[code]);
    this.name = 'UserError';
  }
}
