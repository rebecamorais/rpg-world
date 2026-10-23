/**
 * React Query keys that server components seed (SeededQuery) and hooks read. Shared, so renaming
 * one can't silently turn the server's copy into dead weight.
 */
export const PROFILE_QUERY_KEY = ['profile'] as const;
export const CHARACTERS_QUERY_KEY = ['characters'] as const;
