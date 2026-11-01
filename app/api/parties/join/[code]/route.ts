import { getApi } from '@api';

import { inviteCodeParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.getInvite(params.code);
  },
  { params: inviteCodeParamsSchema },
);

export const POST = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.requestJoin(params.code);
  },
  { params: inviteCodeParamsSchema },
);
