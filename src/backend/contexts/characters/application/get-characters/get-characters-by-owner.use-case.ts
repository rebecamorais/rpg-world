import { Character } from '../../domain/entity/Character';
import { CharacterRepo } from '../../domain/repository';

export class GetCharactersByOwnerUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(ownerUsername: string): Promise<Character[]> {
    if (!ownerUsername) throw new Error('Owner username is required');
    return this.repository.findByOwner(ownerUsername);
  }
}
