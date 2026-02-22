import {
  AttributeKey,
  DnD5eCharacter,
} from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository';

export interface UpdateAttributeInput {
  id: string;
  ownerUsername: string;
  attribute: AttributeKey;
  value: number;
}

export class UpdateCharacterAttributeUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(input: UpdateAttributeInput): Promise<DnD5eCharacter> {
    const character = await this.repository.findById(input.id);

    if (!character) {
      throw new Error('Personagem não encontrado.');
    }

    if (character.ownerUsername !== input.ownerUsername) {
      throw new Error('Não autorizado a modificar este personagem.');
    }

    if (!(character instanceof DnD5eCharacter)) {
      throw new Error('Suporte apenas para D&D 5e no momento.');
    }

    // Domain method encapsulating the rule
    character.attributes.set(input.attribute, input.value);

    await this.repository.save(character);

    return character;
  }
}
