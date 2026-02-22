import { CharacterRepo } from '../../domain/repository';

export class GetCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(id: string) {
    const character = await this.repository.findById(id);
    if (!character) throw new Error('Personagem não encontrado.');

    return character;
  }
}
