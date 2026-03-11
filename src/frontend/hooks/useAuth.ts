import { rpgWorldApi } from '@client';

export function useAuth() {
  const sendMagicLink = async (email: string): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/magic-link', { email });
  };

  const signInWithPassword = async (email: string, password: string): Promise<void> => {
    const response = await rpgWorldApi.post<{
      passwordChangeRequired: boolean;
    }>('/api/auth/login', { email, password });

    if (response.passwordChangeRequired) {
      window.location.href = '/change-password';
    } else {
      window.location.href = '/characters';
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/update-password', { newPassword });
    window.location.href = '/characters';
  };

  const signOut = async (): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/signout');
    window.location.href = '/login';
  };

  return { sendMagicLink, signInWithPassword, updatePassword, signOut };
}
