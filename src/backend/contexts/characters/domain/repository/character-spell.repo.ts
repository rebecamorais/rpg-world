export interface CharacterSpellRelation {
  id: string;
  name: string;
  level: number;
  school: string;
  isPrepared: boolean;
  createdAt?: string;
  components?: string[];
  concentration?: boolean;
  ritual?: boolean;
  materialCost?: number;
  isScaling?: boolean;
  description?: string;
  higherLevel?: string | null;
  material?: string | null;
  castingTime?: string | null;
  castingValue?: number | null;
  durationUnit?: string | null;
  durationValue?: number | null;
  rangeUnit?: string | null;
  rangeValue?: number | null;
  damageType?: string | null;
  spellCategory?: string;
  bgStyleId?: string | null;
}

export interface CharacterSpellRepo {
  findByCharacterId(characterId: string, locale?: string): Promise<CharacterSpellRelation[]>;
  learn(characterId: string, id: string): Promise<void>;
  forget(characterId: string, id: string): Promise<void>;
  togglePrepared(characterId: string, id: string, isPrepared: boolean): Promise<void>;
}
