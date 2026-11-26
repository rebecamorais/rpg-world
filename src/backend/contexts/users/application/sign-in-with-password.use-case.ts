import { UserError, UserErrorCodes } from '../domain/UserError';
import { AuthLoginThrottleRepo } from '../domain/auth-login-throttle.repo';
import { AuthRepository } from '../domain/auth.repo';

const isWrongPassword = (error: unknown) =>
  error instanceof UserError && error.code === UserErrorCodes.SIGNIN_INVALID_CREDENTIALS;

export class SignInWithPasswordUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly throttle: AuthLoginThrottleRepo,
  ) {}

  /**
   * Signs in, within the password attempt limit of the e-mail and of the client's IP. The attempt
   * is taken before asking Auth and given back unless the answer was "wrong password". A locked
   * e-mail answers the same whether it has an account or not.
   */
  async execute(email: string, password: string, ip?: string): Promise<void> {
    if (!email || !password) {
      throw new UserError(UserErrorCodes.SIGNIN_REQUIRED_FIELDS);
    }

    const keys = { email, ip };
    const waitSeconds = await this.throttle.claim(keys);
    if (waitSeconds > 0) {
      throw new UserError(UserErrorCodes.SIGNIN_TOO_MANY_ATTEMPTS, {
        retryAfterMinutes: Math.ceil(waitSeconds / 60),
      });
    }

    try {
      await this.authRepository.signInWithPassword(email, password);
    } catch (error) {
      if (!isWrongPassword(error)) await this.throttle.release(keys);
      throw error;
    }

    // The session cookie is already set: failing here would show an error to someone signed in
    await this.throttle.succeed(keys).catch((error: unknown) => {
      console.error('Failed to reset login attempts after a successful sign-in:', error);
    });
  }
}
