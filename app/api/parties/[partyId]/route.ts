import { getApi } from '@api';

import {
  partyParamsSchema,
  partyPatchSchema,
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
  async ({ user, body, params }) => {
    const { partiesApi } = await getApi();
    if (body.name !== undefined) await partiesApi.rename(params.partyId, body.name);
    if (body.edition !== undefined) await partiesApi.setEdition(params.partyId, body.edition);
    if (body.journalUrl !== undefined) {
      await partiesApi.setJournal(params.partyId, user.id, body.journalUrl);
    }
    return null;
  },
  { params: partyParamsSchema, body: partyPatchSchema },
);

export const DELETE = withAuth(
  async ({ params }) => {
    const { partiesApi } = await getApi();
    await partiesApi.delete(params.partyId);
    return null;
  },
  { params: partyParamsSchema },
);
