import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

/** Server error codes that belong to a field, so the message shows right under it. */
const FIELD_BY_ERROR: Record<string, string> = {
  auth_error_signup_duplicate_email: 'email',
  auth_error_user_not_found: 'email',
  auth_error_signin_email_not_confirmed: 'email',
  auth_error_signin_invalid_credentials: 'password',
  auth_error_signup_invalid_password: 'password',
  auth_error_update_password_weak: 'password',
  auth_error_update_password_same: 'password',
};

/**
 * Shows a server error inline: on its field when the form has one (and focuses it), otherwise
 * at the top of the form (`errors.root`, see FormRootError).
 */
export function setServerError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
  code: string | null | undefined,
  message: string,
) {
  const field = code ? FIELD_BY_ERROR[code] : undefined;
  if (field && (fields as readonly string[]).includes(field)) {
    setError(field as FieldPath<T>, { message }, { shouldFocus: true });
  } else {
    setError('root', { message });
  }
}
