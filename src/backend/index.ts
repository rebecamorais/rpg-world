import { makeCharactersApi } from '@backend/contexts/characters/interfaces/characters.api';
import { makeAuthApi } from '@backend/contexts/users/interfaces/auth.api';
import { makeProfileApi } from '@backend/contexts/users/interfaces/profile.api';

import { makeLoreApi } from './contexts/lore/interfaces/lore.api';
import { getContainer } from './shared/providers/get-container';

export const getApi = async () => {
  const container = await getContainer();
  return {
    charactersApi: makeCharactersApi(container.contexts.character),
    loreApi: makeLoreApi(container.contexts.lore),
    authApi: makeAuthApi(container.contexts.user),
    profileApi: makeProfileApi(container.contexts.user),
  };
};
