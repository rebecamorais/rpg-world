import { getApi } from '@api';

import { withHandler } from '@shared/http/route-handler';

export const POST = withHandler(async () => {
  const { authApi } = await getApi();
  await authApi.signOut();
  return { success: true };
});
