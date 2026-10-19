import { AuthRepository, EmailLinkType } from '../domain/AuthRepository';
import { UserError, UserErrorCodes } from '../domain/UserError';

export class VerifyEmailLinkUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(tokenHash: string, type: EmailLinkType): Promise<void> {
    if (!tokenHash) {
      throw new UserError(UserErrorCodes.AUTH_CODE_REQUIRED);
    }

    await this.authRepository.verifyEmailLink(tokenHash, type);
  }
}
