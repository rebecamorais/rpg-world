import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(newPassword: string): Promise<void> {
    if (!newPassword) {
      throw new UserError(UserErrorCodes.UPDATE_PASSWORD_REQUIRED);
    }

    await this.authRepository.updatePassword(newPassword);
  }
}
