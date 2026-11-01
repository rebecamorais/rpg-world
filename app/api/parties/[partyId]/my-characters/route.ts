import { getApi } from '@api';

import {
  myCharactersSchema,
  partyParamsSchema,
} from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

export const PUT = withAuth(
  async ({ user, body, params }) => {
    const { partiesApi } = await getApi();
    await partiesApi.setMyCharacters(params.partyId, user.id, body.characterIds);
    return null;
  },
  { params: partyParamsSchema, body: myCharactersSchema },
);
