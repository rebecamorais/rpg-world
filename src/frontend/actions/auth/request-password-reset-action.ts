'use server';

import { getApi } from '@api';

import { passwordResetRequestSchema } from '@backend/contexts/users/interfaces/users.schemas';
import { verifyHuman } from '@backend/shared/infrastructure/services/verify-human';

import { errorCode } from '@shared/http/error-response';
import { INVALID_REQUEST } from '@shared/http/validation';

import type { ActionResponse } from '../action-response';

export async function requestPasswordResetAction(
  email: string,
  turnstileToken: string,
): Promise<ActionResponse> {
  const input = passwordResetRequestSchema.safeParse({ email, turnstileToken });
  if (!input.success) {
    return { success: false, error: INVALID_REQUEST };
  }

  // The reset link is generated with the admin API, which bypasses Supabase's e-mail rate
  // limits, so the request must prove it comes from a human before any e-mail is sent.
  const securityError = await verifyHuman(input.data.turnstileToken);
  if (securityError) {
    return { success: false, error: securityError };
  }

  try {
    const api = await getApi();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;
    await api.authApi.requestPasswordReset(input.data.email, redirectTo);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorCode(error) };
  }
}
