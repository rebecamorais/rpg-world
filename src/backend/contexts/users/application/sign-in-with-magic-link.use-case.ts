import { AuthRepository } from '../domain/AuthRepository';

export class SignInWithMagicLinkUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string, redirectTo: string): Promise<void> {
    if (!email) {
      throw new Error('Email is required');
    }
    await this.authRepository.signInWithOtp(email, redirectTo);
  }
}
