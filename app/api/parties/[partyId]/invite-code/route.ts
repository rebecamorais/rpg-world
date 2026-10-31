import { getApi } from '@api';

import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

/** A new invite link; the old one stops working. */
export const POST = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.rotateInviteCode(params.partyId);
  },
  { params: partyParamsSchema },
);
