import { getApi } from '@api';

import { turnSchema } from '@backend/contexts/combat/interfaces/combat.schemas';
import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

// Ends the turn of `participantId` if it's still the current one (the GM's, or a player's own)
export const POST = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.endTurn(params.partyId, body.participantId);
    return null;
  },
  { params: partyParamsSchema, body: turnSchema },
);
