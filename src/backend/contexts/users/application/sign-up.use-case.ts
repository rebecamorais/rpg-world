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
      await this.answerExistingAccount(email, password, confirmUrl);
      return;
    }

    let confirmationLink: string;
    try {
      // admin.generateLink com type: signup cria o usuário e gera o link de confirmação
      confirmationLink = await this.authRepository.generateSignUpLink(email, password, confirmUrl);
    } catch (error) {
      // Registered between the check and the call: same answer
      if (error instanceof UserError && error.code === UserErrorCodes.SIGNUP_DUPLICATE_EMAIL) {
        await this.answerExistingAccount(email, password, confirmUrl);
        return;
      }
      throw error;
    }

    // Starts the interval, so signing up again right away waits like a second request would
    await this.emailThrottle.claim(email, 'signup');
    await this.emailService.sendConfirmationEmail(email, confirmationLink);
  }

  /**
   * At most one e-mail per interval, and none inside it, with the same answer. A confirmed account
   * gets the notice to sign in with its password. One that never confirmed gets a new confirmation
   * link instead, since its password sign-in fails until then.
   */
  private async answerExistingAccount(email: string, password: string, confirmUrl: string) {
    if (!(await this.emailThrottle.claim(email, 'signup'))) return;

    if (!(await this.authRepository.isEmailConfirmed(email))) {
      try {
        // For a user that exists and never confirmed, Supabase only issues a new token: the
        // password stays the one of the first sign-up (pinned in auth-email-throttle.integration.test.ts),
        // so whoever signs up again can't set the password of someone else's account
        const link = await this.authRepository.generateSignUpLink(email, password, confirmUrl);
        await this.emailService.sendConfirmationEmail(email, link);
        return;
      } catch (error) {
        // Confirmed in the meantime: the notice below
        if (!(error instanceof UserError && error.code === UserErrorCodes.SIGNUP_DUPLICATE_EMAIL)) {
          throw error;
        }
      }
    }

    const forgotPasswordLink = `${new URL(confirmUrl).origin}/forgot-password`;
    await this.emailService.sendAccountExistsEmail(email, forgotPasswordLink);
  }
}
