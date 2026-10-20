'use server';

import { getApi } from '@api';

import { magicLinkSchema } from '@backend/contexts/users/interfaces/users.schemas';
import { siteUrl } from '@backend/shared/infrastructure/helpers/site-url';
import { verifyHuman } from '@backend/shared/infrastructure/services/verify-human';

import { errorCode } from '@shared/http/error-response';
import { INVALID_REQUEST } from '@shared/http/validation';

import type { ActionResponse } from '../action-response';

export async function requestMagicLinkAction(
  email: string,
  turnstileToken: string,
): Promise<ActionResponse> {
  const input = magicLinkSchema.safeParse({ email, turnstileToken });
  if (!input.success) {
    return { success: false, error: INVALID_REQUEST };
  }

  // The link is generated with the admin API and sent by us, which bypasses Supabase's e-mail
  // rate limits, so the request must prove it comes from a human before any e-mail is sent.
  const securityError = await verifyHuman(input.data.turnstileToken);
  if (securityError) {
    return { success: false, error: securityError };
  }

  try {
    const api = await getApi();
    await api.authApi.signInWithMagicLink(input.data.email, `${siteUrl()}/api/auth/confirm`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorCode(error) };
  }
}
