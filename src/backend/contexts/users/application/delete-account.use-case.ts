import { AccountDeletionRepo } from '../domain/AccountDeletionRepo';
import { AuthRepository, DeleteUserDatabaseError } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { hashAccountDeletionToken } from '../domain/account-deletion-token';

// The cascade can cross a concurrent invite acceptance or GM claim settlement and lose a deadlock.
// Trying again right away just waits for the other transaction, which by then holds what it needs.
const MAX_RETRIES = 3;

export class DeleteAccountUseCase {
  constructor(
    private readonly accountDeletionRepo: AccountDeletionRepo,
    private readonly authRepository: AuthRepository,
  ) {}

  /**
   * The token is never consumed separately: it leaves with the account, by cascade. So a deletion
   * that failed keeps the link working, and a click after a finished one finds no valid token. Two
   * clicks at once can both get here; only one finds the account, the other gets "link invalid".
   */
  async execute(token: string): Promise<void> {
    const userId = await this.accountDeletionRepo.findValidUserId(hashAccountDeletionToken(token));
    if (!userId) {
      throw new UserError(UserErrorCodes.DELETION_LINK_INVALID);
    }

    for (let retries = 0; ; retries++) {
      try {
        await this.authRepository.deleteUser(userId);
        return;
      } catch (error) {
        if (error instanceof UserError && error.code === UserErrorCodes.AUTH_USER_NOT_FOUND) {
          throw new UserError(UserErrorCodes.DELETION_LINK_INVALID);
        }
        if (!(error instanceof DeleteUserDatabaseError) || retries === MAX_RETRIES) throw error;
      }
    }
  }
}
