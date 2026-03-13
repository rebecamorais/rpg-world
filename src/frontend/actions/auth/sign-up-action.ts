'use server';

import { getApi } from '@/backend';
import { TurnstileService } from '@/backend/shared/infrastructure/services/turnstile-service';
import { redirect } from 'next/navigation';

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
  } catch (error: any) {
    console.error('Sign-up action error:', error);
    return { 
      success: false, 
      error: error.message || 'Auth.errors.signUpFailed' 
    };
  }

  return redirect('/login?message=verification-sent');
}
