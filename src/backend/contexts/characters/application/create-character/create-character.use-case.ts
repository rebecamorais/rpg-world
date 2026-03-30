import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';

export interface CreateCharacterInput {
  id?: string;
  name: string;
  ownerUsername: string;
  system?: string;
  class?: string;
  race?: string;
  level?: number;
}

export class CreateCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(input: CreateCharacterInput): Promise<DnD5eCharacter> {
    if (!input.name || input.name.trim() === '') {
      throw new CharacterError(CharacterErrorCodes.CREATE_NAME_REQUIRED);
    }

    // Simplificação provisória: Assumindo que o jogo é D&D 5e
    // Um factory pattern genérico ersolve disso depois.
    const attributes = new Attributes(); // Valores base 10
    const hp = new HealthPoints(10, 10); // Valor chumbado pra criar, poderia calcular baseado no level

    const character = new DnD5eCharacter({
      id: input.id || crypto.randomUUID(),
      name: input.name.trim(),
      ownerUsername: input.ownerUsername,
      attributes,
      hp,
      level: input.level || 1,
      classStr: input.class || '',
      race: input.race || '',
    });

    await this.repository.save(character);

    return character;
  }
}
