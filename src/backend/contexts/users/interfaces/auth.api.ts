import { AuthContext } from '../index';

export const makeAuthApi = (authContext: AuthContext) => ({
  getSessionUser: async () => {
    return authContext.getSession.execute();
  },

  signInWithMagicLink: async (email: string, redirectTo: string) => {
    await authContext.signInWithMagicLink.execute(email, redirectTo);
    return { success: true };
  },

  signInWithPassword: async (email: string, password: string) => {
    const result = await authContext.signInWithPassword.execute(email, password);
    return { success: true, ...result };
  },

  signUp: async (email: string, password: string) => {
    await authContext.signUp.execute(email, password);
    return { success: true };
  },

  requestPasswordReset: async (email: string, redirectTo: string) => {
    await authContext.requestPasswordReset.execute(email, redirectTo);
    return { success: true };
  },

  updatePassword: async (newPassword: string) => {
    await authContext.updatePassword.execute(newPassword);
    return { success: true };
  },

  callbackExchange: async (code: string) => {
    await authContext.callbackExchange.execute(code);
    return { success: true };
  },

  signOut: async () => {
    await authContext.signOut.execute();
    return { success: true };
  },
});
