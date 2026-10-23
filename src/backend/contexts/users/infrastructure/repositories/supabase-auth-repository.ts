import { AuthError, SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { AuthRepository, EmailLinkType } from '../../domain/AuthRepository';
import { User } from '../../domain/User';
import { UserError, UserErrorCode, UserErrorCodes } from '../../domain/UserError';

const LIST_USERS_PAGE_SIZE = 1000;

// Supabase Auth failures that are expected outcomes (wrong password, weak password...) become
// UserErrors the UI can translate. Anything else stays a plain Error and surfaces as a 500.
const EXPECTED_AUTH_ERRORS: Record<string, UserErrorCode> = {
  invalid_credentials: UserErrorCodes.SIGNIN_INVALID_CREDENTIALS,
  // Same answer as a wrong password: sign-up creates the user with the password it was given only
  // for new e-mails, so "not confirmed" right after a sign-up would reveal that the e-mail had no
  // account before (the sign-up form itself answers the same way for both).
  email_not_confirmed: UserErrorCodes.SIGNIN_INVALID_CREDENTIALS,
  weak_password: UserErrorCodes.UPDATE_PASSWORD_WEAK,
  same_password: UserErrorCodes.UPDATE_PASSWORD_SAME,
  email_exists: UserErrorCodes.SIGNUP_DUPLICATE_EMAIL,
  user_already_exists: UserErrorCodes.SIGNUP_DUPLICATE_EMAIL,
  user_not_found: UserErrorCodes.AUTH_USER_NOT_FOUND,
  over_request_rate_limit: UserErrorCodes.AUTH_RATE_LIMITED,
  over_email_send_rate_limit: UserErrorCodes.AUTH_RATE_LIMITED,
  // E-mail link opened after it expired, or a second time
  otp_expired: UserErrorCodes.AUTH_LINK_EXPIRED,
  flow_state_expired: UserErrorCodes.AUTH_LINK_EXPIRED,
  flow_state_not_found: UserErrorCodes.AUTH_LINK_EXPIRED,
};

function authFailure(error: AuthError, context: string): Error {
  const code = error.code ? EXPECTED_AUTH_ERRORS[error.code] : undefined;
  return code ? new UserError(code) : new Error(`${context}: ${error.message}`);
}

/**
 * Link to our own confirm route, carrying the hashed token instead of Supabase's action link.
 * The action link answers with the session tokens in the URL hash, and accepting tokens from the
 * hash lets any page log a visitor into whatever account those tokens belong to (login CSRF).
 * The confirm route verifies the token on the server, so only a one-time e-mailed token works.
 */
function confirmLink(confirmUrl: string, tokenHash: string | undefined, type: EmailLinkType) {
  if (!tokenHash) {
    throw new Error(`Failed to generate ${type} link: No token returned`);
  }
  const url = new URL(confirmUrl);
  url.searchParams.set('token_hash', tokenHash);
  url.searchParams.set('type', type);
  return url.toString();
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly authClient: SupabaseClient,
    private readonly dbClient: SupabaseClient,
  ) {}

  async generateSignUpLink(email: string, password: string, confirmUrl: string): Promise<string> {
    const { data, error } = await this.dbClient.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });

    if (error) {
      throw authFailure(error, 'Failed to generate signup link');
    }

    return confirmLink(confirmUrl, data.properties?.hashed_token, 'signup');
  }

  async generateRecoveryLink(email: string, confirmUrl: string): Promise<string> {
    const { data, error } = await this.dbClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error) {
      throw authFailure(error, 'Failed to generate recovery link');
    }

    return confirmLink(confirmUrl, data.properties?.hashed_token, 'recovery');
  }

  async verifyEmailLink(tokenHash: string, type: EmailLinkType): Promise<void> {
    const { error } = await this.authClient.auth.verifyOtp({ token_hash: tokenHash, type });

    if (error) {
      throw authFailure(error, 'Failed to verify e-mail link');
    }
  }

  /**
   * Verifies the session's JWT locally against the project's public key (cached JWKS), instead of
   * asking the Auth server on every request like getUser() did. With a legacy HS256 secret,
   * getClaims() still falls back to the Auth server. A revoked session stays valid until its JWT
   * expires.
   */
  async getSessionUser(): Promise<User | null> {
    const { data, error } = await this.authClient.auth.getClaims();

    if (error || !data) {
      return null;
    }

    const { claims } = data;
    return {
      id: claims.sub,
      email: claims.email,
      fullName: claims.user_metadata?.full_name,
      avatarUrl: claims.user_metadata?.avatar_url,
    };
  }

  async generateMagicLink(email: string, confirmUrl: string): Promise<string> {
    // Note: for an unknown e-mail, Supabase creates the user and returns a signup link instead,
    // so callers must check the account exists first
    const { data, error } = await this.dbClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (error) {
      throw authFailure(error, 'Failed to generate magic link');
    }

    return confirmLink(confirmUrl, data.properties?.hashed_token, 'magiclink');
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

  async signOut(): Promise<void> {
    const { error } = await this.authClient.auth.signOut();

    if (error) {
      throw authFailure(error, 'Failed to sign out');
    }
  }
}
