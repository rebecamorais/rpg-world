'use server';

import { getApi } from '@api';

import { updatePasswordSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { INVALID_REQUEST } from '@shared/http/validation';

export async function updatePasswordAction(password: string) {
  const input = updatePasswordSchema.safeParse({ newPassword: password });
  if (!input.success) {
    return { success: false, error: INVALID_REQUEST };
  }

  try {
    const api = await getApi();
    await api.authApi.updatePassword(input.data.newPassword);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao atualizar senha';
    return { success: false, error: message };
  }
}
