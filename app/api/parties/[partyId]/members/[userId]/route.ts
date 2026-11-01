import { getApi } from '@api';

import { memberParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

/** The GM approves a request; the invited person accepts their own invite. */
export const PATCH = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    await partiesApi.acceptMember(params.partyId, params.userId);
    return null;
  },
  { params: memberParamsSchema },
);

/** The GM removes or declines; the person leaves, declines or withdraws. */
export const DELETE = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    await partiesApi.removeMember(params.partyId, params.userId);
    return null;
  },
  { params: memberParamsSchema },
);
