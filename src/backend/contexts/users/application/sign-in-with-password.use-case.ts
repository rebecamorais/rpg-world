import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export interface SignInWithPasswordResult {
  passwordChangeRequired: boolean;
}

export class SignInWithPasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<SignInWithPasswordResult> {
    if (!email || !password) {
      throw new UserError(UserErrorCodes.SIGNIN_REQUIRED_FIELDS);
    }

    await this.authRepository.signInWithPassword(email, password);

    return {
      passwordChangeRequired: password === '123MudaASenha@',
    };
  }
}
