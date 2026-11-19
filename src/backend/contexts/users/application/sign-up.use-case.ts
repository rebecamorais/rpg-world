import { EmailService } from '../../../shared/domain/email.service';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthEmailThrottleRepo } from '../domain/auth-email-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';

export class SignUpUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
    private readonly emailThrottle: AuthEmailThrottleRepo,
  ) {}

  async execute(email: string, password: string, confirmUrl: string): Promise<void> {
    if (!email || !password) {
      throw new UserError(UserErrorCodes.SIGNUP_REQUIRED_FIELDS);
    }

    // An e-mail that already has an account gets the same answer as a new one, and its owner gets
    // an e-mail instead, so the form can't be used to find out who is registered (like the
    // password reset).
    if (await this.authRepository.existsByEmail(email)) {
      await this.answerExistingAccount(email, confirmUrl);
      return;
    }

    let confirmationLink: string;
    try {
      // admin.generateLink com type: signup cria o usuário e gera o link de confirmação
      confirmationLink = await this.authRepository.generateSignUpLink(email, password, confirmUrl);
    } catch (error) {
      // Registered between the check and the call: same answer
      if (error instanceof UserError && error.code === UserErrorCodes.SIGNUP_DUPLICATE_EMAIL) {
        await this.answerExistingAccount(email, confirmUrl);
        return;
      }
      throw error;
    }

    // The interval can only be claimed once the account exists (it is keyed by the user). A second
    // sign-up of the same new e-mail at the same moment reaches the existing-account path instead,
    // which claims the same interval: only one of them sends
    if (!(await this.emailThrottle.claim(email, 'signup'))) return;
    await this.emailService.sendConfirmationEmail(email, confirmationLink);
  }

  /**
   * At most one e-mail per interval, and none inside it, with the same answer. A confirmed account
   * gets the notice to sign in with its password.
   *
   * One that never confirmed may have been started by someone else, with a password they know.
   * Its owner gets a recovery link instead of a new confirmation: opening it confirms the e-mail
   * and asks for a password, so the one set at sign-up never stays in the owner's account.
   */
  private async answerExistingAccount(email: string, confirmUrl: string) {
    if (!(await this.emailThrottle.claim(email, 'signup'))) return;

    if (!(await this.authRepository.isEmailConfirmed(email))) {
      const link = await this.authRepository.generateRecoveryLink(email, confirmUrl);
      await this.emailService.sendFinishSignUpEmail(email, link);
      return;
    }

    const forgotPasswordLink = `${new URL(confirmUrl).origin}/forgot-password`;
    await this.emailService.sendAccountExistsEmail(email, forgotPasswordLink);
  }
}
