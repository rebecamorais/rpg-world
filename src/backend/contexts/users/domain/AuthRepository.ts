import { User } from './User';

/** E-mail links the app sends itself (via the admin API), verified by its confirm route. */
export type EmailLinkType = 'signup' | 'recovery' | 'magiclink';

export interface AuthRepository {
  getSessionUser(): Promise<User | null>;
  signInWithPassword(email: string, password: string): Promise<void>;
  /** Returns the sign-in link to `confirmUrl` for an existing user. */
  generateMagicLink(email: string, confirmUrl: string): Promise<string>;
  /** Creates the user and returns the confirmation link to `confirmUrl`. */
  generateSignUpLink(email: string, password: string, confirmUrl: string): Promise<string>;
  /** Returns the password recovery link to `confirmUrl`. */
  generateRecoveryLink(email: string, confirmUrl: string): Promise<string>;
  /** Verifies the token of an e-mail link and starts the session. */
  verifyEmailLink(tokenHash: string, type: EmailLinkType): Promise<void>;
  exchangeCodeForSession(code: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  signOut(): Promise<void>;
}
