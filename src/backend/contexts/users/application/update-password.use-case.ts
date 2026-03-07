import { AuthRepository } from '../domain/AuthRepository';

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(newPassword: string): Promise<void> {
    if (!newPassword) {
      throw new Error('Nova senha é obrigatória');
    }

    await this.authRepository.updatePassword(newPassword);
  }
}
