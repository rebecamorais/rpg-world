/** The sign-in e-mails the forms send, each with its own interval. */
export type AuthEmailKind = 'magiclink' | 'signup' | 'recovery';

export interface AuthEmailThrottleRepo {
  /**
   * Takes the next e-mail of this kind for the account of `email`. False when one went out too
   * recently, and also when the e-mail has no account: either way nothing is sent. Atomic.
   */
  claim(email: string, kind: AuthEmailKind): Promise<boolean>;
}
