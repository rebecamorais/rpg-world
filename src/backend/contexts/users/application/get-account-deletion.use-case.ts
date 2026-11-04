import { AccountDeletionRepo } from '../domain/AccountDeletionRepo';
import { hashAccountDeletionToken } from '../domain/account-deletion-token';

/**
 * What the page of the e-mailed link shows. Only reads, because antivirus and mail readers open
 * links on their own: the account goes only with the button (DeleteAccountUseCase).
 */
export class GetAccountDeletionUseCase {
  constructor(private readonly accountDeletionRepo: AccountDeletionRepo) {}

  async execute(token: string): Promise<{ username: string | null } | null> {
    const userId = await this.accountDeletionRepo.findValidUserId(hashAccountDeletionToken(token));
    if (!userId) return null;

    return { username: await this.accountDeletionRepo.getUsername(userId) };
  }
}
