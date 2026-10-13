// Port: lore belongs to a character, so access to it follows that character's ownership.
// Implemented by the characters context and injected at composition time.
export interface CharacterOwnership {
  isOwner(characterId: string, userId: string): Promise<boolean>;
}
