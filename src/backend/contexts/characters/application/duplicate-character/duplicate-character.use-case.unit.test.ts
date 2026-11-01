import { describe, expect, it, vi } from 'vitest';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import { DuplicateCharacterUseCase } from './duplicate-character.use-case';

const repoWith = (duplicate: CharacterRepo['duplicate']) =>
  ({ duplicate }) as unknown as CharacterRepo;

describe('DuplicateCharacterUseCase', () => {
  it('duplica com o nome pedido, sem espaços nas pontas, e devolve o id da cópia', async () => {
    const duplicate = vi.fn().mockResolvedValue('copy-1');

    const result = await new DuplicateCharacterUseCase(repoWith(duplicate)).execute(
      'char-1',
      '  Goblin chefe  ',
    );

    expect(result).toEqual({ id: 'copy-1' });
    expect(duplicate).toHaveBeenCalledWith('char-1', 'Goblin chefe');
  });

  it('nome vazio é recusado sem chamar o banco', async () => {
    const duplicate = vi.fn();

    await expect(
      new DuplicateCharacterUseCase(repoWith(duplicate)).execute('char-1', '   '),
    ).rejects.toMatchObject({ code: CharacterErrorCodes.CREATE_NAME_REQUIRED });
    expect(duplicate).not.toHaveBeenCalled();
  });
});
