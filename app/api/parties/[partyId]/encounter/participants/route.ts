import { getApi } from '@api';

import { participantSchema } from '@backend/contexts/combat/interfaces/combat.schemas';
import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const POST = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.addParticipant(params.partyId, body.characterId, body.count, body.side);
    return { added: true };
  },
  { params: partyParamsSchema, body: participantSchema, status: 201 },
);
