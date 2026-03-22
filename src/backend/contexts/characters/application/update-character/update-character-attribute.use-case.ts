import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { AttributeKey, DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
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
      throw new CharacterError(CharacterErrorCodes.UPDATE_NOT_FOUND);
    }

    if (character.ownerUsername !== input.ownerUsername) {
      throw new CharacterError(CharacterErrorCodes.UPDATE_UNAUTHORIZED);
    }

    if (!(character instanceof DnD5eCharacter)) {
      throw new CharacterError(CharacterErrorCodes.UPDATE_SYSTEM_NOT_SUPPORTED);
    }

    // Domain method encapsulating the rule
    character.attributes.set(input.attribute, input.value);

    await this.repository.save(character);

    return character;
  }
}
