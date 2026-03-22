import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class SignUpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

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

    await this.authRepository.signUp(email, password);
  }
}
