import { getApi } from '@api';

import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const POST = withAuth(
  async ({ params }) => {
    const { combatApi } = await getApi();
    await combatApi.start(params.partyId);
    return null;
  },
  { params: partyParamsSchema },
);
