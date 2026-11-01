import { getApi } from '@api';

import { localeQuerySchema } from '@backend/contexts/characters/interfaces/characters.schemas';
import { partyCharacterParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

export const GET = withAuth(
  async ({ req, user, params }) => {
    const { locale } = parseInput(localeQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
    const { charactersApi } = await getApi();
    return charactersApi.getSpellsForPartyGm(params.partyId, params.id, user.id, locale);
  },
  { params: partyCharacterParamsSchema },
);
