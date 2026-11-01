import { getApi } from '@api';

import { duplicateCharacterSchema } from '@backend/contexts/characters/interfaces/characters.schemas';

import { withAuth } from '@shared/http/route-handler';
import { uuidParamsSchema } from '@shared/http/validation';

// Only the owner's own sheets: the database (RLS) refuses any other
export const POST = withAuth(
  async ({ body, params }) => {
    const { charactersApi } = await getApi();
    return charactersApi.duplicate(params.id, body.name);
  },
  { params: uuidParamsSchema, body: duplicateCharacterSchema, status: 201 },
);
