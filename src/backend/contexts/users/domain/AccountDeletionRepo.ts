export interface AccountDeletionRepo {
  /** Keeps the only valid link of the account: a new request replaces the previous one. */
  save(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  /** The account behind a token that is still valid. Only reads: opening a link changes nothing. */
  findValidUserId(tokenHash: string): Promise<string | null>;
  getUsername(userId: string): Promise<string | null>;
}
