import { beforeEach, describe, expect, it } from 'vitest';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { CreateCharacterUseCase } from './create-character.use-case';

describe('CreateCharacterUseCase ', () => {
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
      class: 'Fighter',
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
        class: 'C',
        race: 'R',
        level: 1,
      }),
    ).rejects.toThrowError(CharacterErrorCodes.CREATE_NAME_REQUIRED);
  });

  it('tira espaços do nome e usa nível 1, sem classe e sem raça por padrão', async () => {
    const character = await useCase.execute({
      id: 'char-defaults',
      name: '  Legolas  ',
      ownerUsername: 'user1',
      system: 'DnD_5e',
    });

    expect(character.toJSON()).toMatchObject({
      name: 'Legolas',
      level: 1,
      class: '',
      race: '',
    });
  });
});
