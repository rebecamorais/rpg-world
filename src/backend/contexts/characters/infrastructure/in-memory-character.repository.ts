import { Character } from '../domain/entity/Character';
import { CharacterRepo } from '../domain/repository';

export class InMemoryCharacterRepository implements CharacterRepo {
  private characters: Map<string, Character> = new Map();

  async findById(id: string): Promise<Character | null> {
    return this.characters.get(id) || null;
  }

  async findByOwner(ownerUsername: string): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      (c) => c.ownerUsername === ownerUsername,
    );
  }

  async save(character: Character): Promise<void> {
    this.characters.set(character.id, character);
  }

  async delete(id: string): Promise<boolean> {
    return this.characters.delete(id);
  }
}
