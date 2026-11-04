import { AuthRepository } from '../domain/AuthRepository';

export class HasPasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(userId: string): Promise<boolean> {
    return this.authRepository.hasPassword(userId);
  }
}
