/**
 * React Query keys that server components seed (SeededQuery) and hooks read. Shared, so renaming
 * one can't silently turn the server's copy into dead weight.
 */
export const PROFILE_QUERY_KEY = ['profile'] as const;
export const CHARACTERS_QUERY_KEY = ['characters'] as const;
/** The playable list is CHARACTERS_QUERY_KEY; enemy sheets sit under it, so invalidating it covers both. */
export const charactersQueryKey = (kind: 'pc' | 'npc' = 'pc') =>
  kind === 'pc' ? CHARACTERS_QUERY_KEY : (['characters', 'npc'] as const);
export const SESSION_QUERY_KEY = ['session'] as const;
export const PARTIES_QUERY_KEY = ['parties'] as const;
export const partyQueryKey = (partyId: string) => ['party', partyId] as const;
export const encounterQueryKey = (partyId: string) => ['encounter', partyId] as const;
/** The invite page's preview of the party, polled while a request waits for the GM. */
export const partyInviteQueryKey = (code: string) => ['party-invite', code] as const;
/**
 * The party chest and its writes, as usePartyChest builds them (useInventory adds the locale last,
 * so these prefixes cover every language). The party channel invalidates the chest through them.
 */
export const partyChestQueryKey = (partyId: string) => ['inventory', `party-${partyId}`] as const;
export const partyChestMutationKey = (partyId: string) =>
  ['inventory-write', `party-${partyId}`] as const;
