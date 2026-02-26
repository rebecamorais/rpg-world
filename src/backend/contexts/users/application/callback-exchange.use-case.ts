import { AuthRepository } from '../domain/AuthRepository';

export class CallbackExchangeUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(code: string): Promise<void> {
    if (!code) {
      throw new Error('Code is required');
    }
    await this.authRepository.exchangeCodeForSession(code);
  }
}
