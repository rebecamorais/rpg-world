import { SupabaseClient } from '@supabase/supabase-js';

import { EmailService } from '../../shared/domain/EmailService';
import { SupabaseStorageRepository } from '../../shared/infrastructure/repositories/supabase-storage-repository';
import { CallbackExchangeUseCase } from './application/callback-exchange.use-case';
import { GetProfileUseCase } from './application/get-profile.use-case';
import { GetSessionUserUseCase } from './application/get-session-user.use-case';
import { RequestPasswordResetUseCase } from './application/request-password-reset.use-case';
import { SignInWithMagicLinkUseCase } from './application/sign-in-with-magic-link.use-case';
import { SignInWithPasswordUseCase } from './application/sign-in-with-password.use-case';
import { SignOutUseCase } from './application/sign-out.use-case';
import { SignUpUseCase } from './application/sign-up.use-case';
import { UpdatePasswordUseCase } from './application/update-password.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { UploadAvatarUseCase } from './application/upload-avatar.use-case';
import { VerifyEmailLinkUseCase } from './application/verify-email-link.use-case';
import { SupabaseAuthRepository } from './infrastructure/repositories/supabase-auth-repository';
import { SupabaseProfileRepository } from './infrastructure/repositories/supabase-profile-repository';

export interface AuthContextConfig {
  userClient: SupabaseClient;
  // Service role, required by auth admin APIs (generateLink, listUsers)
  adminClient: SupabaseClient;
  emailService: EmailService;
}

export interface UserProfileContextConfig {
  userClient: SupabaseClient;
}

export interface AuthContext {
  getSession: GetSessionUserUseCase;
  signInWithMagicLink: SignInWithMagicLinkUseCase;
  signInWithPassword: SignInWithPasswordUseCase;
  signUp: SignUpUseCase;
  requestPasswordReset: RequestPasswordResetUseCase;
  updatePassword: UpdatePasswordUseCase;
  callbackExchange: CallbackExchangeUseCase;
  verifyEmailLink: VerifyEmailLinkUseCase;
  signOut: SignOutUseCase;
}

export interface UserProfileContext {
  getProfile: GetProfileUseCase;
  updateProfile: UpdateProfileUseCase;
  uploadAvatar: UploadAvatarUseCase;
}

export const createAuthContext = (config: AuthContextConfig): AuthContext => {
  const authRepository = new SupabaseAuthRepository(config.userClient, config.adminClient);
  const profileRepository = new SupabaseProfileRepository(config.userClient);

  return {
    getSession: new GetSessionUserUseCase(authRepository),
    signInWithMagicLink: new SignInWithMagicLinkUseCase(authRepository),
    signInWithPassword: new SignInWithPasswordUseCase(authRepository),
    signUp: new SignUpUseCase(authRepository, config.emailService),
    requestPasswordReset: new RequestPasswordResetUseCase(authRepository, config.emailService),
    updatePassword: new UpdatePasswordUseCase(authRepository),
    callbackExchange: new CallbackExchangeUseCase(authRepository, profileRepository),
    verifyEmailLink: new VerifyEmailLinkUseCase(authRepository),
    signOut: new SignOutUseCase(authRepository),
  };
};

export const createUserProfileContext = (config: UserProfileContextConfig): UserProfileContext => {
  const profileRepository = new SupabaseProfileRepository(config.userClient);
  const storageRepository = new SupabaseStorageRepository(config.userClient);

  return {
    getProfile: new GetProfileUseCase(profileRepository),
    updateProfile: new UpdateProfileUseCase(profileRepository, storageRepository),
    uploadAvatar: new UploadAvatarUseCase(storageRepository),
  };
};
