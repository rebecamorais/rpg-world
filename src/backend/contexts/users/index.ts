import { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseStorageRepository } from '../../shared/infrastructure/repositories/supabase-storage-repository';
import { CallbackExchangeUseCase } from './application/callback-exchange.use-case';
import { GetSessionUserUseCase } from './application/get-session-user.use-case';
import { SignInWithMagicLinkUseCase } from './application/sign-in-with-magic-link.use-case';
import { SignInWithPasswordUseCase } from './application/sign-in-with-password.use-case';
import { SignOutUseCase } from './application/sign-out.use-case';
import { SignUpUseCase } from './application/sign-up.use-case';
import { UpdatePasswordUseCase } from './application/update-password.use-case';
import { GetProfileUseCase, UpdateProfileUseCase } from './application/update-profile.use-case';
import { UploadAvatarUseCase } from './application/upload-avatar.use-case';
import { User } from './domain/User';
import { SupabaseAuthRepository } from './infrastructure/repositories/supabase-auth-repository';
import { SupabaseProfileRepository } from './infrastructure/repositories/supabase-profile-repository';

export interface UserContextConfig {
  authClient: SupabaseClient;
  dbClient: SupabaseClient;
}

export interface UserContext {
  getSession: GetSessionUserUseCase;
  signInWithMagicLink: SignInWithMagicLinkUseCase;
  signInWithPassword: SignInWithPasswordUseCase;
  signUp: SignUpUseCase;
  updatePassword: UpdatePasswordUseCase;
  callbackExchange: CallbackExchangeUseCase;
  signOut: SignOutUseCase;
  getProfile: GetProfileUseCase;
  updateProfile: UpdateProfileUseCase;
  uploadAvatar: UploadAvatarUseCase;
}

export type { User };

export const createUserContext = (config: UserContextConfig): UserContext => {
  const authRepository = new SupabaseAuthRepository(config.authClient);
  const profileRepository = new SupabaseProfileRepository(config.dbClient);
  const storageRepository = new SupabaseStorageRepository(config.dbClient);

  return {
    getSession: new GetSessionUserUseCase(authRepository),
    signInWithMagicLink: new SignInWithMagicLinkUseCase(authRepository),
    signInWithPassword: new SignInWithPasswordUseCase(authRepository),
    signUp: new SignUpUseCase(authRepository),
    updatePassword: new UpdatePasswordUseCase(authRepository),
    callbackExchange: new CallbackExchangeUseCase(authRepository),
    signOut: new SignOutUseCase(authRepository),
    getProfile: new GetProfileUseCase(profileRepository),
    updateProfile: new UpdateProfileUseCase(profileRepository),
    uploadAvatar: new UploadAvatarUseCase(storageRepository),
  };
};
