import { CharacterRepo } from "../domain/repository";
import { Character } from "../domain/entity/Character";

export class InMemoryCharacterRepository implements CharacterRepo {
    private characters: Character[] = [];

    async findById(id: string): Promise<Character | null> {
        return this.characters.find((character) => character.id === id) || null;
    }
}