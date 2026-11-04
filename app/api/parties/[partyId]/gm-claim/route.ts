import { getApi } from '@api';

import {
  gmClaimVoteSchema,
  partyParamsSchema,
} from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

/** An active player of a party without a GM asks to become it. */
export const POST = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.claimGm(params.partyId);
  },
  { params: partyParamsSchema },
);

/** Another active player accepts or refuses; a refusal ends the request. */
export const PATCH = withAuth(
  async ({ body, params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.voteGmClaim(params.partyId, body.accept);
  },
  { params: partyParamsSchema, body: gmClaimVoteSchema },
);

/** The candidate gives up. */
export const DELETE = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.cancelGmClaim(params.partyId);
  },
  { params: partyParamsSchema },
);
