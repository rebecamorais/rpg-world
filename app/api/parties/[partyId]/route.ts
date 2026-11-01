import { getApi } from '@api';

import {
  partyNameSchema,
  partyParamsSchema,
} from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const GET = withAuth(
  async ({ user, params }) => {
    const { partiesApi } = await getApi();
    return partiesApi.get(params.partyId, user.id);
  },
  { params: partyParamsSchema },
);

export const PATCH = withAuth(
  async ({ body, params }) => {
    const { partiesApi } = await getApi();
    await partiesApi.rename(params.partyId, body.name);
    return null;
  },
  { params: partyParamsSchema, body: partyNameSchema },
);

export const DELETE = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    await partiesApi.delete(params.partyId);
    return null;
  },
  { params: partyParamsSchema },
);
