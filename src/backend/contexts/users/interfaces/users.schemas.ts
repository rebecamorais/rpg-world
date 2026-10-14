import { z } from 'zod';

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@shared/auth/password-policy';
import { httpUrlOrEmpty, optional } from '@shared/http/validation';

const email = z.email().max(320);
const newPassword = z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH);
const turnstileToken = z.string().max(4096);

export const signInWithPasswordSchema = z.object({
  email,
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export const magicLinkSchema = z.object({ email });

export const updatePasswordSchema = z.object({ newPassword: newPassword });

export const signUpSchema = z.object({
  email,
  password: newPassword,
  turnstileToken,
});

export const passwordResetRequestSchema = z.object({ email, turnstileToken });

export const updateProfileSchema = z.object({
  // DB constraint: username has at least 3 characters
  username: optional(z.string().min(3).max(30)),
  fullName: optional(z.string().max(100)),
  avatarUrl: optional(httpUrlOrEmpty),
  primaryColor: optional(z.string().regex(/^#[0-9a-f]{3,8}$/i)),
});
