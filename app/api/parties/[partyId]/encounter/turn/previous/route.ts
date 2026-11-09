import { getApi } from '@api';

import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

// Goes back to the previous turn (the GM only; the database refuses at the first turn)
export const POST = withAuth(
  async ({ params }) => {
    const { combatApi } = await getApi();
    await combatApi.previousTurn(params.partyId);
    return null;
  },
  { params: partyParamsSchema },
);
