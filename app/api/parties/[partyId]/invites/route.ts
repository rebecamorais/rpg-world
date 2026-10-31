import { getApi } from '@api';

import {
  inviteUsernameSchema,
  partyParamsSchema,
} from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const POST = withAuth(
  async ({ body, params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.inviteByUsername(params.partyId, body.username);
  },
  { params: partyParamsSchema, body: inviteUsernameSchema },
);
