import { AuthRepository } from '../domain/AuthRepository';

export interface SignInWithPasswordResult {
  passwordChangeRequired: boolean;
}

export class SignInWithPasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(
    email: string,
    password: string,
  ): Promise<SignInWithPasswordResult> {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    await this.authRepository.signInWithPassword(email, password);

    return {
      passwordChangeRequired: password === '123MudaASenha@',
    };
  }
}
