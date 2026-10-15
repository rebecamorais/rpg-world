'use server';

import { getApi } from '@api';

import { signUpSchema } from '@backend/contexts/users/interfaces/users.schemas';
import { siteUrl } from '@backend/shared/infrastructure/helpers/site-url';
import { verifyHuman } from '@backend/shared/infrastructure/services/verify-human';

import { errorCode } from '@shared/http/error-response';
import { INVALID_REQUEST } from '@shared/http/validation';

import type { ActionResponse } from '../action-response';

export async function signUpAction(formData: FormData): Promise<ActionResponse> {
  const input = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    turnstileToken: formData.get('turnstile-token') ?? '',
  });

  if (!input.success) {
    return { success: false, error: INVALID_REQUEST };
  }

  const { email, password, turnstileToken } = input.data;

  const securityError = await verifyHuman(turnstileToken);
  if (securityError) {
    return { success: false, error: securityError };
  }

  try {
    const api = await getApi();
    await api.authApi.signUp(email, password, `${siteUrl()}/auth/confirm`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorCode(error) };
  }
}
