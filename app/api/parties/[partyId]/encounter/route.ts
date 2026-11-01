import { getApi } from '@api';

import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

// The combat as the person asking may see it: the GM's tracker, or the turn order (204 without one)
export const GET = withAuth(
  async ({ user, params }) => {
    const { combatApi } = await getApi();
    return combatApi.get(params.partyId, user.id);
  },
  { params: partyParamsSchema },
);

export const POST = withAuth(
  async ({ params }) => {
    const { combatApi } = await getApi();
    await combatApi.create(params.partyId);
    return { created: true };
  },
  { params: partyParamsSchema, status: 201 },
);

export const DELETE = withAuth(
  async ({ params }) => {
    const { combatApi } = await getApi();
    await combatApi.finish(params.partyId);
    return null;
  },
  { params: partyParamsSchema },
);
