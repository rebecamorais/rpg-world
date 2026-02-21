import { Character } from "../entity/Character";

export type CharacterRepo = {
    findById(id: string): Promise<Character | null>;
};