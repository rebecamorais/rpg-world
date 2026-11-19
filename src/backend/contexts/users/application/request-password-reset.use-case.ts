import { EmailService } from '../../../shared/domain/email.service';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthEmailThrottleRepo } from '../domain/auth-email-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';

export class RequestPasswordResetUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
    private readonly emailThrottle: AuthEmailThrottleRepo,
  ) {}

  async execute(email: string, redirectTo: string): Promise<void> {
    if (!email) {
      throw new Error('Email é obrigatório');
    }

    // False for an unknown e-mail and for one that got a link too recently: the same answer as a
    // sent link, so the form reveals nothing and can't flood an inbox.
    if (!(await this.emailThrottle.claim(email, 'recovery'))) return;

    let resetLink: string;
    try {
      resetLink = await this.authRepository.generateRecoveryLink(email, redirectTo);
    } catch (error) {
      // Deleted since the claim: the same answer
      if (error instanceof UserError && error.code === UserErrorCodes.AUTH_USER_NOT_FOUND) return;
      throw error;
    }

    await this.emailService.sendPasswordResetEmail(email, resetLink);
  }
}
