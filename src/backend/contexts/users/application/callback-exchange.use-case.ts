import { AuthRepository } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class CallbackExchangeUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(code: string): Promise<void> {
    if (!code) {
      throw new UserError(UserErrorCodes.AUTH_CODE_REQUIRED);
    }
    await this.authRepository.exchangeCodeForSession(code);
  }
}
