import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { AuthRepository } from '../../domain/AuthRepository';
import { User } from '../../domain/User';

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly authClient: SupabaseClient,
    private readonly dbClient: SupabaseClient,
  ) {}

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
      throw new Error(`Failed to sign in with OTP: ${error.message}`);
    }
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Failed to sign in with password: ${error.message}`);
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.authClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(`Failed to sign up: ${error.message}`);
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    const {
      data: { users },
      error,
    } = await this.dbClient.auth.admin.listUsers();

    if (error) {
      throw new Error(`Failed to check if user exists: ${error.message}`);
    }

    return users.some((user) => user.email === email);
  }

  async exchangeCodeForSession(code: string): Promise<void> {
    const { error } = await this.authClient.auth.exchangeCodeForSession(code);

    if (error) {
      throw new Error(`Failed to exchange code for session: ${error.message}`);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.authClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.authClient.auth.signOut();

    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }
}
