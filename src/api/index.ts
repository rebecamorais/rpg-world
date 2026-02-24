// src/api/index.ts
import { charactersApi } from '@/backend/contexts/characters/interfaces/characters.api';

export const isServer = typeof window === 'undefined';

export const api = {
  characters: charactersApi,
  // users: usersApi,
};
