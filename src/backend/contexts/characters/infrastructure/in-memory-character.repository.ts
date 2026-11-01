import { Character, CharacterKind } from '../domain/entity/Character';
import { CharacterRepo } from '../domain/repository';

export class InMemoryCharacterRepository implements CharacterRepo {
  private characters: Map<string, Character> = new Map();

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
    this.characters.set(character.id, character);
  }

  async delete(id: string): Promise<boolean> {
    return this.characters.delete(id);
  }

  async duplicate(id: string, name: string): Promise<string> {
    const original = this.characters.get(id);
    if (!original) throw new Error(`Character ${id} not found`);
    const copy = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
      id: crypto.randomUUID(),
      name,
      avatarUrl: undefined,
    }) as Character;
    this.characters.set(copy.id, copy);
    return copy.id;
  }
}
