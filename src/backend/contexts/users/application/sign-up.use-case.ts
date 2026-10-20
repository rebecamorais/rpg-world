import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';
import { DEFAULT_FIRST_ACCESS_PASSWORD } from '../domain/default-password';

export class SignUpUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string, password: string, confirmUrl: string): Promise<void> {
    if (!email || !password) {
      throw new UserError(UserErrorCodes.SIGNUP_REQUIRED_FIELDS);
    }

    // A senha de primeiro acesso NÃO pode ser a senha padrão de reset/migração
    if (password === DEFAULT_FIRST_ACCESS_PASSWORD) {
      throw new UserError(UserErrorCodes.SIGNUP_INVALID_PASSWORD);
    }

    // An e-mail that already has an account gets the same answer as a new one, and its owner gets
    // a notice instead, so the form can't be used to find out who is registered (like the
    // password reset). The account itself is left untouched.
    if (await this.authRepository.existsByEmail(email)) {
      await this.notifyAccountExists(email, confirmUrl);
      return;
    }

    let confirmationLink: string;
    try {
      // admin.generateLink com type: signup cria o usuário e gera o link de confirmação
      confirmationLink = await this.authRepository.generateSignUpLink(email, password, confirmUrl);
    } catch (error) {
      // Registered between the check and the call: same answer
      if (error instanceof UserError && error.code === UserErrorCodes.SIGNUP_DUPLICATE_EMAIL) {
        await this.notifyAccountExists(email, confirmUrl);
        return;
      }
      throw error;
    }

    await this.emailService.sendConfirmationEmail(email, confirmationLink);
  }

  private async notifyAccountExists(email: string, confirmUrl: string) {
    const forgotPasswordLink = `${new URL(confirmUrl).origin}/forgot-password`;
    await this.emailService.sendAccountExistsEmail(email, forgotPasswordLink);
  }
}
