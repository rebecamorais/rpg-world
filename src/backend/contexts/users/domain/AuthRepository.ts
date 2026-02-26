import { User } from './User';

export interface AuthRepository {
  getSessionUser(): Promise<User | null>;
  signInWithOtp(email: string, redirectTo: string): Promise<void>;
  exchangeCodeForSession(code: string): Promise<void>;
  signOut(): Promise<void>;
}
