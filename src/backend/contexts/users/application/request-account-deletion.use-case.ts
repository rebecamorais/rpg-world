import { EmailService } from '../../../shared/domain/EmailService';
import { AccountDeletionRepo } from '../domain/AccountDeletionRepo';
import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';
import {
  ACCOUNT_DELETION_LINK_LIFETIME_MS,
  generateAccountDeletionToken,
  hashAccountDeletionToken,
} from '../domain/account-deletion-token';

export interface RequestAccountDeletionInput {
  userId: string;
  email: string;
  username: string;
  password?: string;
}

/** First step of deleting an account: nothing is deleted here, only the e-mail goes out. */
export class RequestAccountDeletionUseCase {
  constructor(
    private readonly accountDeletionRepo: AccountDeletionRepo,
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: RequestAccountDeletionInput, confirmUrl: string): Promise<void> {
    const username = await this.accountDeletionRepo.getUsername(input.userId);
    if (username !== input.username) {
      throw new UserError(UserErrorCodes.DELETION_USERNAME_MISMATCH);
    }

    // The account says whether it has a password, never the request: otherwise anyone holding an
    // open session could leave the field empty and skip the check
    if (await this.authRepository.hasPassword(input.userId)) {
      await this.checkPassword(input);
    }

    if (!(await this.accountDeletionRepo.claimEmailSlot(input.userId))) {
      throw new UserError(UserErrorCodes.DELETION_TOO_SOON);
    }

    const token = generateAccountDeletionToken();
    await this.accountDeletionRepo.save(
      input.userId,
      hashAccountDeletionToken(token),
      new Date(Date.now() + ACCOUNT_DELETION_LINK_LIFETIME_MS),
    );

    // base64url needs no escaping
    await this.emailService.sendAccountDeletionEmail(input.email, `${confirmUrl}?token=${token}`);

    await this.accountDeletionRepo.clearPasswordAttempts(input.userId);
  }

  /**
   * The attempt is taken before asking Auth, so simultaneous guesses can't all pass the limit, and
   * given back unless the answer was "wrong password".
   */
  private async checkPassword({ userId, email, password }: RequestAccountDeletionInput) {
    if (!password) {
      throw new UserError(UserErrorCodes.DELETION_PASSWORD_INVALID);
    }

    if (!(await this.accountDeletionRepo.claimPasswordAttempt(userId))) {
      throw new UserError(UserErrorCodes.DELETION_TOO_MANY_ATTEMPTS);
    }

    let correct: boolean;
    try {
      correct = await this.authRepository.verifyPassword(email, password);
    } catch (error) {
      await this.accountDeletionRepo.releasePasswordAttempt(userId);
      throw error;
    }

    if (!correct) {
      throw new UserError(UserErrorCodes.DELETION_PASSWORD_INVALID);
    }
    await this.accountDeletionRepo.releasePasswordAttempt(userId);
  }
}
