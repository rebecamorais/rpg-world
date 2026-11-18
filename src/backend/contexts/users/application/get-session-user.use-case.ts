import { User } from '../domain/User';
import { AuthRepository } from '../domain/auth.repo';

export class GetSessionUserUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<User | null> {
    const user = await this.authRepository.getSessionUser();
    if (!user) return null;

    // The JWT is verified locally and outlives a deleted account until it expires
    return (await this.authRepository.accountExists(user.id)) ? user : null;
  }
}
