// src/services/index.ts
import { container } from '@/backend/shared/infrastructure/container';

// Now we can use the new fluent contexts API
export const characterContext = container.contexts.character;

// For backward compatibility or convenience if needed,
// but we should prefer using the context directly or a dedicated service instance
export const characterService = container.get<any>('characterService');
