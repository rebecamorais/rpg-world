import { getApi } from '@api';

import { partyCharacterParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(
  async ({ user, params }) => {
    const { loreApi } = await getApi();
    const lore = await loreApi.getForPartyGm(params.partyId, params.id, user.id);
    return lore || {};
  },
  { params: partyCharacterParamsSchema },
);
