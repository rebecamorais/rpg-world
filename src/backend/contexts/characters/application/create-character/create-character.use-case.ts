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
      throw new Error('Nome do personagem é obrigatório');
    }

    // Simplificação provisória: Assumindo que o jogo é D&D 5e
    // Um factory pattern genérico ersolve disso depois.
    const attributes = new Attributes(); // Valores base 10
    const hp = new HealthPoints(10, 10); // Valor chumbado pra criar, poderia calcular baseado no level

    const character = new DnD5eCharacter(
      input.id || crypto.randomUUID(),
      input.name.trim(),
      input.ownerUsername,
      attributes,
      hp,
      input.level || 1,
      input.class || '',
      input.race || '',
    );

    await this.repository.save(character);

    return character;
  }
}
