import { makeCharactersApi } from '@/backend/contexts/characters/interfaces/characters.api';

import { getContainer } from './shared/infrastructure/get-container';

export const getApi = async () => {
  const container = await getContainer();
  return {
    charactersApi: makeCharactersApi(container.contexts.character),
  };
};
