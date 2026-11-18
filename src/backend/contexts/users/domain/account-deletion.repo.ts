export interface AccountDeletionRepo {
  /** Keeps the only valid link of the account: a new request replaces the previous one. */
  save(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  /** The account behind a token that is still valid. Only reads: opening a link changes nothing. */
  findValidUserId(tokenHash: string): Promise<string | null>;
  getUsername(userId: string): Promise<string | null>;
  /** Takes one of the account's password attempts; false when they ran out. Atomic. */
  claimPasswordAttempt(userId: string): Promise<boolean>;
  /** Gives back one attempt that turned out not to be a wrong password. */
  releasePasswordAttempt(userId: string): Promise<void>;
  clearPasswordAttempts(userId: string): Promise<void>;
  /** Takes the account's next e-mail; false if one went out too recently. Atomic. */
  claimEmailSlot(userId: string): Promise<boolean>;
}
