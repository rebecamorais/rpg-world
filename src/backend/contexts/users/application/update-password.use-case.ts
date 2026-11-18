import { EmailService } from '../../../shared/domain/email.service';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { AccountDeletionRepo } from '../domain/account-deletion.repo';
import { AuthRepository } from '../domain/auth.repo';
import { checkAccountPassword } from './check-account-password';

export interface UpdatePasswordInput {
  userId: string;
  email: string;
  /** Required when the account has a password; ignored when it has none (Google only). */
  currentPassword?: string;
  newPassword: string;
}

/**
 * Changes the password of the signed-in account. An open session alone is not enough: whoever
 * holds one (a borrowed computer) could lock the owner out, so the current password is asked
 * again, and the owner gets an e-mail saying it changed.
 */
export class UpdatePasswordUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordAttempts: AccountDeletionRepo,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: UpdatePasswordInput, forgotPasswordLink: string): Promise<void> {
    if (!input.newPassword) {
      throw new UserError(UserErrorCodes.UPDATE_PASSWORD_REQUIRED);
    }

    // The account says whether it has a password, never the request
    const hadPassword = await this.authRepository.hasPassword(input.userId);
    if (hadPassword) {
      await checkAccountPassword(
        this.authRepository,
        this.passwordAttempts,
        { userId: input.userId, email: input.email, password: input.currentPassword },
        UserErrorCodes.UPDATE_PASSWORD_CURRENT_INVALID,
      );
    }

    await this.authRepository.updatePassword(input.newPassword);

    if (hadPassword) {
      await this.passwordAttempts.clearPasswordAttempts(input.userId).catch((error: Error) => {
        console.error('Failed to clear password attempts:', error.message);
      });
    }

    // The password already changed: a failed e-mail must not report the change as failed
    try {
      await this.emailService.sendPasswordChangedEmail(input.email, forgotPasswordLink);
    } catch (error) {
      console.error('Failed to send the password changed e-mail:', (error as Error).name);
    }
  }
}
