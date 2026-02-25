import { makeCharactersApi } from '@/backend/contexts/characters/interfaces/characters.api';
import { container } from '@/backend/shared/infrastructure/container';

export const api = {
  characters: makeCharactersApi(container.contexts.character),
};
