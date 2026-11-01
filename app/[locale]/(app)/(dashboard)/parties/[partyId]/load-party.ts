import { cache } from 'react';

import { getApi } from '@api';

/** Loaded once per request (title and page). Null when not found or not the person's. */
export const loadParty = cache(async (partyId: string) => {
  const { authApi, partiesApi } = await getApi();
  const user = await authApi.getSessionUser();
  return user ? partiesApi.get(partyId, user.id).catch(() => null) : null;
});
