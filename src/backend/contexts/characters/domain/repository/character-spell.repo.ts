export interface CharacterSpellRelation {
  spellId: string;
  name: string;
  level: number;
  school: string;
  isPrepared: boolean;
  createdAt?: string;
}

export interface CharacterSpellRepo {
  findByCharacterId(characterId: string, locale?: string): Promise<CharacterSpellRelation[]>;
  learn(characterId: string, spellId: string): Promise<void>;
  forget(characterId: string, spellId: string): Promise<void>;
  togglePrepared(characterId: string, spellId: string, isPrepared: boolean): Promise<void>;
}
