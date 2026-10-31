import { getApi } from '@api';

import { partyNameSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(async () => {
  const { partiesApi } = await getApi();
  return partiesApi.listMine();
});

export const POST = withAuth(
  async ({ user, body }) => {
    const { partiesApi } = await getApi();
    return partiesApi.create(user.id, body.name);
  },
  { body: partyNameSchema, status: 201 },
);
