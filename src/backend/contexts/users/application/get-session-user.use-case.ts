import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class GetSessionUserUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<User | null> {
    return this.authRepository.getSessionUser();
  }
}
