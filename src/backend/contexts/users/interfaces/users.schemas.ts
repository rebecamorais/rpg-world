import { z } from 'zod';

import { httpUrlOrEmpty, optional } from '@shared/http/validation';

const email = z.email().max(320);
const password = (min: number) => z.string().min(min).max(200);

export const signInWithPasswordSchema = z.object({ email, password: z.string().min(1).max(200) });

export const magicLinkSchema = z.object({ email });

export const updatePasswordSchema = z.object({ newPassword: password(6) });

export const signUpSchema = z.object({
  email,
  password: password(8),
  turnstileToken: z.string().max(4096),
});

export const passwordResetRequestSchema = z.object({ email });

export const updateProfileSchema = z.object({
  // DB constraint: username has at least 3 characters
  username: optional(z.string().min(3).max(30)),
  fullName: optional(z.string().max(100)),
  avatarUrl: optional(httpUrlOrEmpty),
  primaryColor: optional(z.string().regex(/^#[0-9a-f]{3,8}$/i)),
});
