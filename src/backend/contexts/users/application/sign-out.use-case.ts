import { AuthRepository } from '../domain/auth.repo';

export class SignOutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.signOut();
  }
}
