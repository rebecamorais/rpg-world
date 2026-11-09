import { getApi } from '@api';

import {
  initiativeSchema,
  participantParamsSchema,
} from '@backend/contexts/combat/interfaces/combat.schemas';

import { withAuth } from '@shared/http/route-handler';

// A player sets (or clears, with null) the initiative of their own participant
export const PUT = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.setMyInitiative(params.partyId, params.participantId, body.initiative);
    return null;
  },
  { params: participantParamsSchema, body: initiativeSchema },
);
