import { rpgWorldApi } from '@client';

export function useAuth() {
  const sendMagicLink = async (email: string): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/magic-link', { email });
  };

  const signOut = async (): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/signout');
    window.location.href = '/login';
  };

  return { sendMagicLink, signOut };
}
