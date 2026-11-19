/** Username rules shared by the username forms and the profile API. */
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;

/**
 * Lowercase letters, digits and `_`, 3 to 30 of them. Anything else lets a look-alike in: a space,
 * an invisible character or a Cyrillic "е" makes another "mestre" at the table. Usernames saved
 * before this rule keep working; it applies when the username changes.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
