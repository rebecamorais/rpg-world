// Port: the GM of a party reads (never writes) the characters brought to it. Implemented by the
// parties context and injected into the characters and lore contexts at composition time.
export interface PartyGmAccess {
  isGmOfCharacter(partyId: string, characterId: string, userId: string): Promise<boolean>;
}
