import { UserContext } from '../index';

export const makeAuthApi = (userContext: UserContext) => ({
  getSessionUser: async () => {
    return userContext.getSession.execute();
  },

  signInWithMagicLink: async (email: string, redirectTo: string) => {
    await userContext.signInWithMagicLink.execute(email, redirectTo);
    return { success: true };
  },

  signInWithPassword: async (email: string, password: string) => {
    await userContext.signInWithPassword.execute(email, password);
    return { success: true };
  },

  callbackExchange: async (code: string) => {
    await userContext.callbackExchange.execute(code);
    return { success: true };
  },

  signOut: async () => {
    await userContext.signOut.execute();
    return { success: true };
  },
});
