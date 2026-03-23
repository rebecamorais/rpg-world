import { EmailService } from '../../../shared/domain/EmailService';
import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class SignUpUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string, password: string): Promise<void> {
    if (!email || !password) {
      throw new UserError(UserErrorCodes.SIGNUP_REQUIRED_FIELDS);
    }

    // A senha de primeiro acesso NÃO pode ser a senha padrão de reset/migração
    if (password === '123MudarASenha@') {
      throw new UserError(UserErrorCodes.SIGNUP_INVALID_PASSWORD);
    }

    const exists = await this.authRepository.existsByEmail(email);
    if (exists) {
      throw new UserError(UserErrorCodes.SIGNUP_DUPLICATE_EMAIL);
    }

    // Gerar link de confirmação e criar usuário (admin.generateLink com type: signup faz ambos)
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`;
    const confirmationLink = await this.authRepository.generateSignUpLink(
      email,
      password,
      redirectTo,
    );

    // Enviar e-mail via EmailService (Resend)
    await this.emailService.sendConfirmationEmail(email, confirmationLink);
  }
}
