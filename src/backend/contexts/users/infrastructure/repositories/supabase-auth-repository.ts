import { AuthError, SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { AuthRepository } from '../../domain/AuthRepository';
import { User } from '../../domain/User';
import { UserError, UserErrorCode, UserErrorCodes } from '../../domain/UserError';

const LIST_USERS_PAGE_SIZE = 1000;

// Supabase Auth failures that are expected outcomes (wrong password, weak password...) become
// UserErrors the UI can translate. Anything else stays a plain Error and surfaces as a 500.
const EXPECTED_AUTH_ERRORS: Record<string, UserErrorCode> = {
  invalid_credentials: UserErrorCodes.SIGNIN_INVALID_CREDENTIALS,
  email_not_confirmed: UserErrorCodes.SIGNIN_EMAIL_NOT_CONFIRMED,
  weak_password: UserErrorCodes.UPDATE_PASSWORD_WEAK,
  same_password: UserErrorCodes.UPDATE_PASSWORD_SAME,
  email_exists: UserErrorCodes.SIGNUP_DUPLICATE_EMAIL,
  user_already_exists: UserErrorCodes.SIGNUP_DUPLICATE_EMAIL,
  user_not_found: UserErrorCodes.AUTH_USER_NOT_FOUND,
  over_request_rate_limit: UserErrorCodes.AUTH_RATE_LIMITED,
  over_email_send_rate_limit: UserErrorCodes.AUTH_RATE_LIMITED,
};

function authFailure(error: AuthError, context: string): Error {
  const code = error.code ? EXPECTED_AUTH_ERRORS[error.code] : undefined;
  return code ? new UserError(code) : new Error(`${context}: ${error.message}`);
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly authClient: SupabaseClient,
    private readonly dbClient: SupabaseClient,
  ) {}

  async generateSignUpLink(email: string, password: string, redirectTo: string): Promise<string> {
    const { data, error } = await this.dbClient.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo },
    });

    if (error) {
      throw authFailure(error, 'Failed to generate signup link');
    }

    if (!data.properties?.action_link) {
      throw new Error('Failed to generate signup link: No link returned');
    }

    return data.properties.action_link;
  }

  async generateRecoveryLink(email: string, redirectTo: string): Promise<string> {
    const { data, error } = await this.dbClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (error) {
      throw authFailure(error, 'Failed to generate recovery link');
    }

    if (!data.properties?.action_link) {
      throw new Error('Failed to generate recovery link: No link returned');
    }

    return data.properties.action_link;
  }

  async getSessionUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.authClient.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }

  async signInWithOtp(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.authClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw authFailure(error, 'Failed to sign in with OTP');
    }
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw authFailure(error, 'Failed to sign in with password');
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.authClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw authFailure(error, 'Failed to sign up');
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    // listUsers is paginated, so a single call only sees the first page of users.
    const target = email.toLowerCase();
    let page: number | null = 1;

    while (page) {
      const { data, error } = await this.dbClient.auth.admin.listUsers({
        page,
        perPage: LIST_USERS_PAGE_SIZE,
      });

      if (error) {
        throw authFailure(error, 'Failed to check if user exists');
      }

      if (data.users.some((user) => user.email?.toLowerCase() === target)) {
        return true;
      }

      page = data.nextPage || null;
    }

    return false;
  }

  async exchangeCodeForSession(code: string): Promise<void> {
    const { error } = await this.authClient.auth.exchangeCodeForSession(code);

    if (error) {
      throw authFailure(error, 'Failed to exchange code for session');
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.authClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw authFailure(error, 'Failed to update password');
    }
  }

  async resetPasswordForEmail(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.authClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw authFailure(error, 'Failed to send reset password email');
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.authClient.auth.signOut();

    if (error) {
      throw authFailure(error, 'Failed to sign out');
    }
  }
}
