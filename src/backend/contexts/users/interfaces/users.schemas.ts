import { z } from 'zod';

import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  fitsPasswordBytes,
} from '@shared/auth/password-policy';
import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from '@shared/auth/username-policy';
import { httpUrlOrEmpty, optional } from '@shared/http/validation';

const email = z.email().max(320);
const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH)
  .max(MAX_PASSWORD_LENGTH)
  .refine(fitsPasswordBytes, 'Password is too long');
const turnstileToken = z.string().max(4096);

export const signInWithPasswordSchema = z.object({
  email,
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export const magicLinkSchema = z.object({ email, turnstileToken });

// The current password is checked only when the account has one (the account says, never the
// request), like the account deletion
export const updatePasswordSchema = z.object({
  currentPassword: optional(z.string().max(MAX_PASSWORD_LENGTH)),
  newPassword: newPassword,
});

export const signUpSchema = z.object({
  email,
  password: newPassword,
  turnstileToken,
});

export const passwordResetRequestSchema = z.object({ email, turnstileToken });

// Not trimmed or lowercased: the username has to match exactly. An empty password stays empty, and
// an account with a password refuses it.
export const accountDeletionRequestSchema = z.object({
  username: z.string().min(1).max(30),
  password: optional(z.string().max(MAX_PASSWORD_LENGTH)),
});

export const deleteAccountSchema = z.object({ token: z.string().min(1).max(128) });

export const updateProfileSchema = z.object({
  // Only the length here: a username saved before USERNAME_PATTERN may be sent back unchanged.
  // UpdateProfileUseCase checks the pattern when the username changes.
  username: optional(z.string().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH)),
  // An empty name or avatar clears it
  fullName: optional(z.string().max(100)),
  avatarUrl: optional(httpUrlOrEmpty),
});
