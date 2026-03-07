import { User } from './User';

export interface AuthRepository {
  getSessionUser(): Promise<User | null>;
  signInWithOtp(email: string, redirectTo: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  exchangeCodeForSession(code: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  signOut(): Promise<void>;
}
