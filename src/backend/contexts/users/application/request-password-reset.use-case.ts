import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';

export class RequestPasswordResetUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string, redirectTo: string): Promise<void> {
    if (!email) {
      throw new Error('Email é obrigatório');
    }

    const resetLink = await this.authRepository.generateRecoveryLink(email, redirectTo);

    await this.emailService.sendPasswordResetEmail(email, resetLink);
  }
}
