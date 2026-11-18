import { UserError, type UserErrorCode, UserErrorCodes } from '../domain/UserError';
import { AccountDeletionRepo } from '../domain/account-deletion.repo';
import { AuthRepository } from '../domain/auth.repo';

type PasswordAttempts = Pick<
  AccountDeletionRepo,
  'claimPasswordAttempt' | 'releasePasswordAttempt'
>;

/**
 * Asks for the password again before a sensitive action from an open session (deleting the
 * account, changing the password). Both share the account's attempt limit, so guessing through one
 * doesn't add tries to the other. The attempt is taken before asking Auth, so simultaneous guesses
 * can't all pass the limit, and given back unless the answer was "wrong password".
 */
export async function checkAccountPassword(
  authRepository: AuthRepository,
  attempts: PasswordAttempts,
  { userId, email, password }: { userId: string; email: string; password?: string },
  invalidCode: UserErrorCode,
): Promise<void> {
  if (!password) {
    throw new UserError(invalidCode);
  }

  if (!(await attempts.claimPasswordAttempt(userId))) {
    throw new UserError(UserErrorCodes.DELETION_TOO_MANY_ATTEMPTS);
  }

  let correct: boolean;
  try {
    correct = await authRepository.verifyPassword(email, password);
  } catch (error) {
    await attempts.releasePasswordAttempt(userId);
    throw error;
  }

  if (!correct) {
    throw new UserError(invalidCode);
  }
  await attempts.releasePasswordAttempt(userId);
}
