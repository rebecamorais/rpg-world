// src/api/index.ts
import { charactersApi } from '@/backend/contexts/characters/interfaces/characters.api';

export const api = {
  characters: charactersApi,
  // users: usersApi,
};
