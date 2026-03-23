'use server';

import { getApi } from '@/backend';

export async function updatePasswordAction(password: string) {
  if (!password) {
    return { success: false, error: 'Nova senha é obrigatória' };
  }

  try {
    const api = await getApi();
    await api.authApi.updatePassword(password);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar senha';
    return { success: false, error: message };
  }
}
