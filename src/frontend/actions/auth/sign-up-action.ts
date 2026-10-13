'use server';

import { getApi } from '@api';

import { signUpSchema } from '@backend/contexts/users/interfaces/users.schemas';
import { TurnstileService } from '@backend/shared/infrastructure/services/turnstile-service';

import { errorCode } from '@shared/http/error-response';
import { INVALID_REQUEST } from '@shared/http/validation';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

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

  // 1. Verify Turnstile Token
  const turnstile = await TurnstileService.verify(turnstileToken);
  if (!turnstile.success) {
    return { success: false, error: turnstile.error || 'security_verification_failed' };
  }

  try {
    const api = await getApi();
    await api.authApi.signUp(email, password, `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorCode(error) };
  }
}
