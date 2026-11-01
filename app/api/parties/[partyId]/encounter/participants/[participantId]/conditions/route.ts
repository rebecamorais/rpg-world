import { getApi } from '@api';

import {
  conditionsSchema,
  participantParamsSchema,
} from '@backend/contexts/combat/interfaces/combat.schemas';

import { withAuth } from '@shared/http/route-handler';

export const PUT = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.setConditions(params.partyId, params.participantId, body.conditions);
    return null;
  },
  { params: participantParamsSchema, body: conditionsSchema },
);
