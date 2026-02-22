import { CharacterRepo } from '../../domain/repository';

export class DeleteCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(id: string, ownerUsername: string): Promise<boolean> {
    const character = await this.repository.findById(id);

    if (!character) {
      throw new Error('Personagem não encontrado.');
    }

    if (character.ownerUsername !== ownerUsername) {
      throw new Error('Não autorizado a excluir este personagem.');
    }

    return this.repository.delete(id);
  }
}
