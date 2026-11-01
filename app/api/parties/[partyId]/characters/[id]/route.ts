import { getApi } from '@api';

import { partyCharacterParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';

// Read only: the GM of the party reads the sheets brought to it. No writes under this path.
export const GET = withAuth(
  async ({ user, params }) => {
    const { charactersApi } = await getApi();
    return charactersApi.getForPartyGm(params.partyId, params.id, user.id);
  },
  { params: partyCharacterParamsSchema },
);
