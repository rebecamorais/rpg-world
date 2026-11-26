import { RequestAccountDeletionInput } from '../application/request-account-deletion.use-case';
import { UpdatePasswordInput } from '../application/update-password.use-case';
import { EmailLinkType } from '../domain/auth.repo';
import { AuthContext } from '../index';

export const makeAuthApi = (authContext: AuthContext) => ({
  getSessionUser: async () => {
    return authContext.getSession.execute();
  },

  signInWithMagicLink: async (email: string, confirmUrl: string) => {
    await authContext.signInWithMagicLink.execute(email, confirmUrl);
    return { success: true };
  },

  signInWithPassword: async (email: string, password: string, clientIp?: string) => {
    await authContext.signInWithPassword.execute(email, password, clientIp);
    return { success: true };
  },

  signUp: async (email: string, password: string, redirectTo: string) => {
    await authContext.signUp.execute(email, password, redirectTo);
    return { success: true };
  },

  requestPasswordReset: async (email: string, redirectTo: string) => {
    await authContext.requestPasswordReset.execute(email, redirectTo);
    return { success: true };
  },

  updatePassword: async (input: UpdatePasswordInput, forgotPasswordLink: string) => {
    await authContext.updatePassword.execute(input, forgotPasswordLink);
    return { success: true };
  },

  callbackExchange: async (code: string) => {
    await authContext.callbackExchange.execute(code);
    return { success: true };
  },

  verifyEmailLink: async (tokenHash: string, type: EmailLinkType) => {
    await authContext.verifyEmailLink.execute(tokenHash, type);
    return { success: true };
  },

  signOut: async () => {
    await authContext.signOut.execute();
    return { success: true };
  },

  requestAccountDeletion: async (input: RequestAccountDeletionInput, confirmUrl: string) => {
    await authContext.requestAccountDeletion.execute(input, confirmUrl);
  },

  getAccountDeletion: async (token: string) => {
    return authContext.getAccountDeletion.execute(token);
  },

  deleteAccount: async (token: string) => {
    await authContext.deleteAccount.execute(token);
  },

  hasPassword: async (userId: string) => {
    return authContext.hasPassword.execute(userId);
  },
});
