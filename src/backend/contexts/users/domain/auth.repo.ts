import { User } from './User';

/** E-mail links the app sends itself (via the admin API), verified by its confirm route. */
export type EmailLinkType = 'signup' | 'recovery' | 'magiclink';

/**
 * Deleting the user failed inside the database and was rolled back, so it is safe to try again.
 * The Auth server answers a bare 500 for any such failure, deadlocks (40P01) included: the code
 * itself never reaches this side.
 */
export class DeleteUserDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeleteUserDatabaseError';
  }
}

export interface AuthRepository {
  getSessionUser(): Promise<User | null>;
  signInWithPassword(email: string, password: string): Promise<void>;
  /** Returns the sign-in link to `confirmUrl` for an existing user. */
  generateMagicLink(email: string, confirmUrl: string): Promise<string>;
  /** Creates the user and returns the confirmation link to `confirmUrl`. */
  generateSignUpLink(email: string, password: string, confirmUrl: string): Promise<string>;
  /** Returns the password recovery link to `confirmUrl`. */
  generateRecoveryLink(email: string, confirmUrl: string): Promise<string>;
  /**
   * For an account started but never confirmed: replaces its password with a random one nobody
   * knows, then returns a recovery link (it confirms the e-mail and leads to choosing a password).
   * The password set at sign-up stops working at once, even if the link is never finished.
   */
  generateFinishSignUpLink(email: string, confirmUrl: string): Promise<string>;
  /** Verifies the token of an e-mail link and starts the session. */
  verifyEmailLink(tokenHash: string, type: EmailLinkType): Promise<void>;
  exchangeCodeForSession(code: string): Promise<void>;
  /**
   * Sets the account's password on the server's behalf. Only after the current password was
   * checked: Supabase's "secure password change" would refuse the session itself after 24 h.
   */
  updatePassword(userId: string, newPassword: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  /** Whether the account of `email` confirmed its address; false when there is no account. */
  isEmailConfirmed(email: string): Promise<boolean>;
  signOut(): Promise<void>;
  /** Whether the account still exists: a session's JWT outlives a deleted account. */
  accountExists(userId: string): Promise<boolean>;
  /**
   * Whether the account has a password: false only for Google-only accounts. Whoever came in through
   * the old magic link has a random one they never saw, indistinguishable from a real one, and
   * recovers it through "Forgot password".
   */
  hasPassword(userId: string): Promise<boolean>;
  /** Checks the password without touching the current session. */
  verifyPassword(email: string, password: string): Promise<boolean>;
  /** @throws DeleteUserDatabaseError, or UserError AUTH_USER_NOT_FOUND if already deleted. */
  deleteUser(userId: string): Promise<void>;
}
