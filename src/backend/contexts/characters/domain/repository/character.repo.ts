import { Character } from "../entity/Character";

export interface CharacterRepo {
    findById(id: string): Promise<Character | null>;
    save(character: Character): Promise<void>;
    delete(id: string): Promise<boolean>;
}