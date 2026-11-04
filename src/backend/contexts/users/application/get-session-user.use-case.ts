import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class GetSessionUserUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<User | null> {
    const user = await this.authRepository.getSessionUser();
    if (!user) return null;

    // The JWT is verified locally and outlives a deleted account until it expires
    return (await this.authRepository.accountExists(user.id)) ? user : null;
  }
}
