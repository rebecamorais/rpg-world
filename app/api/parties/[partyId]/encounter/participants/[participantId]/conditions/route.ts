import { getApi } from '@api';

import {
  conditionChangeSchema,
  conditionsSchema,
  participantParamsSchema,
} from '@backend/contexts/combat/interfaces/combat.schemas';

import { withAuth } from '@shared/http/route-handler';

/** Replaces the whole list (older clients): the last one to save wins. */
export const PUT = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.setConditions(params.partyId, params.participantId, body.conditions);
    return null;
  },
  { params: participantParamsSchema, body: conditionsSchema },
);

/**
 * Turns ONE condition on (`{ key, active: true, level? }`) or off (`{ key, active: false }`): the
 * GM and a player switching different conditions at once keep both.
 */
export const PATCH = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.changeCondition(params.partyId, params.participantId, body);
    return null;
  },
  { params: participantParamsSchema, body: conditionChangeSchema },
);
