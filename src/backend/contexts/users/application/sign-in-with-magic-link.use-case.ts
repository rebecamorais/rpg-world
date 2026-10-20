import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class SignInWithMagicLinkUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string, confirmUrl: string): Promise<void> {
    if (!email) {
      throw new UserError(UserErrorCodes.SIGNIN_MAGIC_LINK_EMAIL_REQUIRED);
    }

    // Only existing accounts get a link: generating one for an unknown e-mail would create the
    // account. The answer is the same either way, so the form can't be used to find out who is
    // registered (like the password reset). New accounts come from sign-up or Google.
    if (!(await this.authRepository.existsByEmail(email))) return;

    const link = await this.authRepository.generateMagicLink(email, confirmUrl);
    await this.emailService.sendMagicLinkEmail(email, link);
  }
}
