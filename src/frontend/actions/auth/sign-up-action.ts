'use server';

import { redirect } from 'next/navigation';

import { getApi } from '@/backend';
import { TurnstileService } from '@/backend/shared/infrastructure/services/turnstile-service';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function signUpAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const turnstileToken = formData.get('turnstile-token') as string;

  if (!email || !password) {
    return { success: false, error: 'Common.errors.requiredFields' }; // Use i18n keys
  }

  // 1. Verify Turnstile Token
  const turnstile = await TurnstileService.verify(turnstileToken);
  if (!turnstile.success) {
    return { success: false, error: turnstile.error || 'Auth.errors.invalidSecurityToken' };
  }

  try {
    const api = await getApi();
    await api.authApi.signUp(email, password);

    // Success - Redirecionar para página de verificação ou dashboard
    // No Supabase, se o e-mail confirmation estiver ON, o usuário precisa confirmar.
    // Redirecionamos para uma página informativa.
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth.errors.signUpFailed';
    return {
      success: false,
      error: message,
    };
  }

  return redirect('/login?message=verification-sent');
}
