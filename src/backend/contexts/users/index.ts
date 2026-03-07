import { SupabaseClient } from '@supabase/supabase-js';

import { CallbackExchangeUseCase } from './application/callback-exchange.use-case';
import { GetSessionUserUseCase } from './application/get-session-user.use-case';
import { SignInWithMagicLinkUseCase } from './application/sign-in-with-magic-link.use-case';
import { SignInWithPasswordUseCase } from './application/sign-in-with-password.use-case';
import { SignOutUseCase } from './application/sign-out.use-case';
import { UpdatePasswordUseCase } from './application/update-password.use-case';
import { User } from './domain/User';
import { SupabaseAuthRepository } from './infrastructure/repositories/supabase-auth-repository';

export interface UserContextConfig {
  authClient: SupabaseClient;
}

export interface UserContext {
  getSession: GetSessionUserUseCase;
  signInWithMagicLink: SignInWithMagicLinkUseCase;
  signInWithPassword: SignInWithPasswordUseCase;
  updatePassword: UpdatePasswordUseCase;
  callbackExchange: CallbackExchangeUseCase;
  signOut: SignOutUseCase;
}

export type { User };

export const createUserContext = (config: UserContextConfig): UserContext => {
  const authRepository = new SupabaseAuthRepository(config.authClient);

  return {
    getSession: new GetSessionUserUseCase(authRepository),
    signInWithMagicLink: new SignInWithMagicLinkUseCase(authRepository),
    signInWithPassword: new SignInWithPasswordUseCase(authRepository),
    updatePassword: new UpdatePasswordUseCase(authRepository),
    callbackExchange: new CallbackExchangeUseCase(authRepository),
    signOut: new SignOutUseCase(authRepository),
  };
};
