'use server';

import { getApi } from '@/backend';

export async function requestPasswordResetAction(email: string) {
  if (!email) {
    return { success: false, error: 'E-mail é obrigatório' };
  }

  try {
    const api = await getApi();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;
    await api.authApi.requestPasswordReset(email, redirectTo);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao solicitar recuperação';
    return { success: false, error: message };
  }
}
