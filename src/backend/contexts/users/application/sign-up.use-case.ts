import { AuthRepository } from '../domain/AuthRepository';

export class SignUpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<void> {
    if (!email || !password) {
      throw new Error('auth_error_signup_required_fields');
    }

    // A senha de primeiro acesso NÃO pode ser a senha padrão de reset/migração
    if (password === '123MudarASenha@') {
      throw new Error('auth_error_signup_invalid_password');
    }

    const exists = await this.authRepository.existsByEmail(email);
    if (exists) {
      throw new Error('auth_error_signup_duplicate_email');
    }

    await this.authRepository.signUp(email, password);
  }
}
