import { rpgWorldApi } from '@client';

// A full page load, not router.push: the session cookie changed, so the server components and
// the query cache of the previous user must not survive the navigation
function reloadAt(path: string) {
  window.location.href = path;
}

export function useAuth() {
  const signInWithPassword = async (email: string, password: string): Promise<void> => {
    const response = await rpgWorldApi.post<{
      passwordChangeRequired: boolean;
    }>('/api/auth/login', { email, password });

    if (response.passwordChangeRequired) {
      reloadAt('/change-password');
    } else {
      reloadAt('/characters');
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    await rpgWorldApi.post<void>('/api/auth/update-password', { newPassword });
    reloadAt('/characters');
  };

  const signOut = async (): Promise<void> => {
    try {
      await rpgWorldApi.post<void>('/api/auth/signout');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      reloadAt('/login');
    }
  };

  return { signInWithPassword, updatePassword, signOut };
}
