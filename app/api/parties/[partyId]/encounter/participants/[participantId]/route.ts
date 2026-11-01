import { getApi } from '@api';

import {
  participantParamsSchema,
  participantPatchSchema,
} from '@backend/contexts/combat/interfaces/combat.schemas';

import { withAuth } from '@shared/http/route-handler';

export const PATCH = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.updateParticipant(params.partyId, params.participantId, body);
    return null;
  },
  { params: participantParamsSchema, body: participantPatchSchema },
);

export const DELETE = withAuth(
  async ({ params }) => {
    const { combatApi } = await getApi();
    await combatApi.removeParticipant(params.partyId, params.participantId);
    return null;
  },
  { params: participantParamsSchema },
);
