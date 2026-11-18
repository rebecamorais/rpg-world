import { AuthRepository } from '../domain/auth.repo';

export class HasPasswordUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(userId: string): Promise<boolean> {
    return this.authRepository.hasPassword(userId);
  }
}
