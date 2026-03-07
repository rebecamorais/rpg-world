import { AuthRepository } from '../domain/AuthRepository';

export class SignInWithPasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<void> {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    await this.authRepository.signInWithPassword(email, password);
  }
}
