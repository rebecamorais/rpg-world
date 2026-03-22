import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class SignInWithMagicLinkUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string, redirectTo: string): Promise<void> {
    if (!email) {
      throw new UserError(UserErrorCodes.SIGNIN_MAGIC_LINK_EMAIL_REQUIRED);
    }
    await this.authRepository.signInWithOtp(email, redirectTo);
  }
}
