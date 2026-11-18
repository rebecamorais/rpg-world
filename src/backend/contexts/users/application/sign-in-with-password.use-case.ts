import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthRepository } from '../domain/auth.repo';

export class SignInWithPasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<void> {
    if (!email || !password) {
      throw new UserError(UserErrorCodes.SIGNIN_REQUIRED_FIELDS);
    }

    await this.authRepository.signInWithPassword(email, password);
  }
}
