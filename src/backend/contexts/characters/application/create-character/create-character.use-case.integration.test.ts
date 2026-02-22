import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { CreateCharacterUseCase } from './create-character.use-case';

describe('CreateCharacterUseCase (Integration)', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: CreateCharacterUseCase;

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
    useCase = new CreateCharacterUseCase(repo);
  });

  it('deve criar e salvar um personagem com sucesso', async () => {
    const character = await useCase.execute({
      id: 'char-new',
      name: 'Gimli',
      ownerUsername: 'user1',
      system: 'DnD_5e',
      characterClass: 'Fighter',
      race: 'Dwarf',
      level: 1,
    });

    expect(character.id).toBe('char-new');
    expect(character.name).toBe('Gimli');

    const saved = await repo.findById('char-new');
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('Gimli');
  });

  it('não deve permitir criar personagem sem nome', async () => {
    await expect(
      useCase.execute({
        id: 'id1',
        name: '   ',
        ownerUsername: 'u',
        system: 'D',
        characterClass: 'C',
        race: 'R',
        level: 1,
      }),
    ).rejects.toThrowError('Nome do personagem é obrigatório');
  });
});
