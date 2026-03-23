import { User } from './User';

export interface AuthRepository {
  getSessionUser(): Promise<User | null>;
  signInWithOtp(email: string, redirectTo: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  generateSignUpLink(email: string, password: string, redirectTo: string): Promise<string>;
  generateRecoveryLink(email: string, redirectTo: string): Promise<string>;
  resetPasswordForEmail(email: string, redirectTo: string): Promise<void>;
  exchangeCodeForSession(code: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  signOut(): Promise<void>;
}
