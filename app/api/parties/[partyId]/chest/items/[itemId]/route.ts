import { getApi } from '@api';

import { setItemQuantitySchema } from '@backend/contexts/characters/interfaces/characters.schemas';
import { partyChestItemParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

/** Sets the absolute quantity of an entry in the chest. */
export const PATCH = withAuth(
  async ({ body, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.setPartyChestItemQuantity(params.partyId, params.itemId, body.quantity);
    return null; // → 204 No Content
  },
  { params: partyChestItemParamsSchema, body: setItemQuantitySchema },
);

export const DELETE = withAuth(
  async ({ params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.removePartyChestItem(params.partyId, params.itemId);
    return null; // → 204 No Content
  },
  { params: partyChestItemParamsSchema },
);
