import { getApi } from '@api';

import { orderSchema } from '@backend/contexts/combat/interfaces/combat.schemas';
import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const PUT = withAuth(
  async ({ body, params }) => {
    const { combatApi } = await getApi();
    await combatApi.setOrder(params.partyId, body.participantIds);
    return null;
  },
  { params: partyParamsSchema, body: orderSchema },
);
