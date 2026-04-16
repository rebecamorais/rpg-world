import { AuthRepository } from '../domain/AuthRepository';
import { ProfileRepository } from '../domain/ProfileRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class CallbackExchangeUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(code: string): Promise<void> {
    if (!code) {
      throw new UserError(UserErrorCodes.AUTH_CODE_REQUIRED);
    }

    await this.authRepository.exchangeCodeForSession(code);

    const user = await this.authRepository.getSessionUser();
    if (!user) {
      throw new Error('Failed to retrieve user after callback exchange');
    }

    const profile = await this.profileRepository.getById(user.id);

    if (!profile) {
      await this.profileRepository.create({
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      });
    }
  }
}
