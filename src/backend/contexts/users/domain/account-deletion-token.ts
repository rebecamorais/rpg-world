import { createHash, randomBytes } from 'node:crypto';

export const ACCOUNT_DELETION_LINK_LIFETIME_MS = 60 * 60 * 1000;

export function generateAccountDeletionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Only this hash is stored: whoever reads the database cannot build the link. */
export function hashAccountDeletionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
