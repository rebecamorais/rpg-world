import { AuthRepository } from '../domain/AuthRepository';

export class SignUpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<void> {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    // A senha de primeiro acesso NÃO pode ser a senha padrão de reset/migração
    if (password === '123MudarASenha@') {
      throw new Error('Esta senha não pode ser utilizada para cadastro inicial.');
    }

    await this.authRepository.signUp(email, password);
  }
}
