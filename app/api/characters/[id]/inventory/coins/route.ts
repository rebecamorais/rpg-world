import { getApi } from '@api';

import { setCoinsSchema } from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { uuidParamsSchema } from '@shared/http/validation';

/** Replaces the coins of a container with the five absolute values. */
export const PUT = withAuth(
  async ({ user, body, params }) => {
    const { charactersApi } = await getApi();
    await charactersApi.setCoins(params.id, user.id, body.containerId, body.coins);
    return null; // → 204 No Content
  },
  { params: uuidParamsSchema, body: setCoinsSchema },
);
