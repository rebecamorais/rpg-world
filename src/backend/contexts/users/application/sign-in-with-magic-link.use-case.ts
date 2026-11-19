import { EmailService } from '../../../shared/domain/email.service';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthEmailThrottleRepo } from '../domain/auth-email-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';

export class SignInWithMagicLinkUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
    private readonly emailThrottle: AuthEmailThrottleRepo,
  ) {}

  async execute(email: string, confirmUrl: string): Promise<void> {
    if (!email) {
      throw new UserError(UserErrorCodes.SIGNIN_MAGIC_LINK_EMAIL_REQUIRED);
    }

    // Only existing accounts get a link: generating one for an unknown e-mail would create the
    // account. The claim is false for an unknown e-mail and for one that got a link too recently,
    // and the answer is the same in every case, so the form can't be used to find out who is
    // registered nor to flood an inbox. New accounts come from sign-up or Google.
    if (!(await this.emailThrottle.claim(email, 'magiclink'))) return;

    // A magic link would confirm an account someone else may have started with their own
    // password, and leave that password in place. Its owner chooses the password instead
    if (!(await this.authRepository.isEmailConfirmed(email))) {
      const link = await this.authRepository.generateFinishSignUpLink(email, confirmUrl);
      await this.emailService.sendFinishSignUpEmail(email, link);
      return;
    }

    const link = await this.authRepository.generateMagicLink(email, confirmUrl);
    await this.emailService.sendMagicLinkEmail(email, link);
  }
}
