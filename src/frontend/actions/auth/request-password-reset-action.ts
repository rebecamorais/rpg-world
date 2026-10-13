'use server';

import { getApi } from '@api';

import { passwordResetRequestSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { errorCode } from '@shared/http/error-response';
import { INVALID_REQUEST } from '@shared/http/validation';

export async function requestPasswordResetAction(email: string) {
  const input = passwordResetRequestSchema.safeParse({ email });
  if (!input.success) {
    return { success: false, error: INVALID_REQUEST };
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
