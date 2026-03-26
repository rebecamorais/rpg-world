'use server';

import { getApi } from '@api';

import { TurnstileService } from '@backend/shared/infrastructure/services/turnstile-service';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function signUpAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const turnstileToken = formData.get('turnstile-token') as string;

  if (!email || !password) {
    return { success: false, error: 'auth_error_signup_required_fields' };
  }

  // 1. Verify Turnstile Token
  const turnstile = await TurnstileService.verify(turnstileToken);
  if (!turnstile.success) {
    return { success: false, error: turnstile.error || 'security_verification_failed' };
  }

  try {
    const api = await getApi();
    await api.authApi.signUp(email, password);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'auth_error_signup_failed';
    return {
      success: false,
      error: message,
    };
  }
}
