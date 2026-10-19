/** Password rules shared by the sign-up, reset and change-password forms and the API schemas. */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

/**
 * Supabase Auth hashes passwords with bcrypt and refuses anything longer than 72 bytes (UTF-8),
 * so a longer password can never be set. Checking it up front also keeps sign-up answering the
 * same way for registered and new e-mails: only new ones would reach Supabase and fail.
 */
const MAX_PASSWORD_BYTES = 72;

export function fitsPasswordBytes(password: string): boolean {
  return new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES;
}
