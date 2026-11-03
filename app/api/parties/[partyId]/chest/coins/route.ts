import { getApi } from '@api';

import { setCoinsSchema } from '@backend/contexts/characters/interfaces/characters.schemas';
import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

/** Replaces the chest's coins with the five absolute values. */
export const PUT = withAuth(
  async ({ body, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.setPartyChestCoins(params.partyId, body.containerId, body.coins);
    return null; // → 204 No Content
  },
  { params: partyParamsSchema, body: setCoinsSchema },
);
