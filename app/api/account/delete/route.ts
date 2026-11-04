import { getApi } from '@api';

import { deleteAccountSchema } from '@backend/contexts/users/interfaces/users.schemas';

import { withHandler } from '@shared/http/route-handler';

/**
 * The final button of the e-mailed link. No session needed (the token is the authority), and POST
 * only: antivirus and mail readers open links on their own.
 */
export const POST = withHandler(
  async ({ body }) => {
    const { authApi } = await getApi();
    await authApi.deleteAccount(body.token);

    // The account is gone by now, so failing here can't turn that into an error. A session left
    // behind no longer counts: GetSessionUserUseCase checks that the account exists.
    try {
      await authApi.signOut();
    } catch (error) {
      console.error('Failed to end the session of a deleted account:', error);
    }
  },
  { body: deleteAccountSchema },
);
