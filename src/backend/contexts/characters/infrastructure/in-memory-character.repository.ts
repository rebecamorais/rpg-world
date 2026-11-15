import { Character, CharacterKind } from '../domain/entity/Character';
import { CharacterRepo } from '../domain/repository';

// Game state left out of the sheet's revision, as the characters trigger does
// (private.character_sheet_fields): it saves at once and comes from many places
const GAME_STATE = ['hpCurrent', 'hpTemp', 'deathSaves', 'avatarUrl', 'sheetBackgroundUrl'];
const stripKey = (value: unknown, key: string) => {
  if (!value || typeof value !== 'object') return value;
  const { [key]: _drop, ...rest } = value as Record<string, unknown>;
  return rest;
};
// Only the die is a sheet field, in either shape hit dice were stored: what was spent is game state
const HIT_DIE = /^(d6|d8|d10|d12)$/;
const LEGACY_HIT_DIE = /(d6|d8|d10|d12)$/;
const hitDieOnly = (value: unknown) => {
  if (!value || typeof value !== 'object') return value;
  const { die, total } = value as { die?: unknown; total?: unknown };
  if (typeof die === 'string' && HIT_DIE.test(die)) return { die };
  return { die: typeof total === 'string' ? total.match(LEGACY_HIT_DIE)?.[1] : undefined };
};
// An empty map counts as absent, as jsonb_object_agg over nothing is null
const stripEach = (map: unknown, key: string, dropEmpty: boolean) => {
  if (!map || typeof map !== 'object') return undefined;
  const entries = Object.entries(map)
    .map(([k, v]) => [k, stripKey(v, key)] as const)
    .filter(([, v]) => !dropEmpty || !v || typeof v !== 'object' || Object.keys(v).length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const sheetFields = (character: Character): string => {
  const json: Record<string, unknown> = { ...character.toJSON() };
  for (const key of [...GAME_STATE, 'revision']) delete json[key];
  json.spellSlots = stripEach(json.spellSlots, 'used', false);
  json.resources = stripEach(json.resources, 'used', true);
  json.spellPoints = stripKey(json.spellPoints, 'current');
  json.hitDice = hitDieOnly(json.hitDice);
  return JSON.stringify(json);
};

export class InMemoryCharacterRepository implements CharacterRepo {
  private characters: Map<string, Character> = new Map();
  // What the sheet looked like at the last write: findById hands out the stored instance, so the
  // "old row" the trigger compares against has to be kept apart
  private sheets: Map<string, string> = new Map();

  async findById(id: string): Promise<Character | null> {
    return this.characters.get(id) || null;
  }

  async findOwnerId(id: string): Promise<string | null> {
    return this.characters.get(id)?.ownerUsername ?? null;
  }

  async findByOwner(ownerUsername: string, kind: CharacterKind = 'pc'): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      (c) => c.ownerUsername === ownerUsername && c.kind === kind,
    );
  }

  async save(character: Character): Promise<void> {
    this.write(character);
  }

  async saveIfUnchanged(character: Character): Promise<boolean> {
    const stored = this.characters.get(character.id);
    if (!stored || stored.rowVersion !== character.rowVersion) return false;
    this.write(character);
    return true;
  }

  private write(character: Character): void {
    const sheet = sheetFields(character);
    const stored = this.characters.get(character.id);
    if (stored) {
      // An update: the stored row decides, whatever the instance carries (like the trigger)
      character.rowVersion = stored.rowVersion + 1;
      character.revision = stored.revision + (this.sheets.get(character.id) === sheet ? 0 : 1);
    }
    this.sheets.set(character.id, sheet);
    this.characters.set(character.id, character);
  }

  async delete(id: string): Promise<boolean> {
    this.sheets.delete(id);
    return this.characters.delete(id);
  }

  async duplicate(id: string, name: string): Promise<string> {
    const original = this.characters.get(id);
    if (!original) throw new Error(`Character ${id} not found`);
    const copy = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
      id: crypto.randomUUID(),
      name,
      avatarUrl: undefined,
      revision: 0,
      rowVersion: 0,
    }) as Character;
    this.write(copy);
    return copy.id;
  }
}
