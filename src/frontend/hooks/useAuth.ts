import { rpgWorldApi } from '@client';

export function useAuth() {
  const sendMagicLink = async (email: string): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/magic-link', { email });
  };

  const signInWithPassword = async (
    email: string,
    password: string,
  ): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/login', { email, password });
    window.location.href = '/characters';
  };

  const signOut = async (): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/signout');
    window.location.href = '/login';
  };

  return { sendMagicLink, signInWithPassword, signOut };
}
