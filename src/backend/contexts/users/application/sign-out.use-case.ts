import { AuthRepository } from '../domain/AuthRepository';

export class SignOutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.signOut();
  }
}
