import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class RequestPasswordResetUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string, redirectTo: string): Promise<void> {
    if (!email) {
      throw new Error('Email é obrigatório');
    }

    let resetLink: string;
    try {
      resetLink = await this.authRepository.generateRecoveryLink(email, redirectTo);
    } catch (error) {
      // Answer the same way for unknown emails, so the form can't be used to discover accounts.
      if (error instanceof UserError && error.code === UserErrorCodes.AUTH_USER_NOT_FOUND) return;
      throw error;
    }

    await this.emailService.sendPasswordResetEmail(email, resetLink);
  }
}
