import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CharacterError, CharacterErrorCodes } from '../domain/CharacterError';
import { DnD5eCharacter } from '../domain/entity/DnD5eCharacter';
import { Attributes } from '../domain/value-object/Attributes';
import { HealthPoints } from '../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../infrastructure/in-memory-character.repository';
import { assertOwnsCharacter, findOwnedCharacter } from './find-owned-character';

let repo: InMemoryCharacterRepository;

beforeEach(async () => {
  repo = new InMemoryCharacterRepository();
  await repo.save(
    new DnD5eCharacter({
      id: 'char-1',
      name: 'Hero',
      ownerUsername: 'owner-1',
      attributes: new Attributes(),
      hp: new HealthPoints(10, 10),
      level: 1,
    }),
  );
});

describe('findOwnedCharacter', () => {
  it('retorna o personagem quando o solicitante é o dono', async () => {
    const character = await findOwnedCharacter(repo, 'char-1', 'owner-1', 'write');
    expect(character.id).toBe('char-1');
  });

  it('lança not_found quando o personagem não existe', async () => {
    const error = await findOwnedCharacter(repo, 'missing', 'owner-1', 'write').catch((e) => e);
    expect(error).toBeInstanceOf(CharacterError);
    expect(error.code).toBe(CharacterErrorCodes.ACCESS_NOT_FOUND);
    expect(error.kind).toBe('not_found');
  });

  it('lança forbidden quando outro usuário tenta escrever', async () => {
    const error = await findOwnedCharacter(repo, 'char-1', 'intruder', 'write').catch((e) => e);
    expect(error.code).toBe(CharacterErrorCodes.ACCESS_FORBIDDEN);
    expect(error.kind).toBe('forbidden');
  });

  it('esconde a existência do personagem em leituras de outro usuário', async () => {
    const error = await findOwnedCharacter(repo, 'char-1', 'intruder', 'read').catch((e) => e);
    expect(error.code).toBe(CharacterErrorCodes.ACCESS_NOT_FOUND);
    expect(error.kind).toBe('not_found');
  });

  it('usa os códigos específicos do caso de uso quando informados', async () => {
    const codes = {
      notFound: CharacterErrorCodes.DELETE_NOT_FOUND,
      forbidden: CharacterErrorCodes.DELETE_UNAUTHORIZED,
    };

    await expect(findOwnedCharacter(repo, 'missing', 'owner-1', 'write', codes)).rejects.toThrow(
      CharacterErrorCodes.DELETE_NOT_FOUND,
    );
    await expect(findOwnedCharacter(repo, 'char-1', 'intruder', 'write', codes)).rejects.toThrow(
      CharacterErrorCodes.DELETE_UNAUTHORIZED,
    );
  });

  it('rejeita solicitante vazio', async () => {
    await expect(findOwnedCharacter(repo, 'char-1', '', 'read')).rejects.toThrow(
      CharacterErrorCodes.ACCESS_NOT_FOUND,
    );
  });
});

describe('assertOwnsCharacter', () => {
  it('passa para o dono lendo só quem é o dono, sem carregar o personagem', async () => {
    const findById = vi.spyOn(repo, 'findById');

    await expect(assertOwnsCharacter(repo, 'char-1', 'owner-1', 'write')).resolves.toBeUndefined();
    expect(findById).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', 'owner-1', 'write', CharacterErrorCodes.ACCESS_NOT_FOUND],
    ['char-1', 'intruder', 'write', CharacterErrorCodes.ACCESS_FORBIDDEN],
    ['char-1', 'intruder', 'read', CharacterErrorCodes.ACCESS_NOT_FOUND],
    ['char-1', '', 'read', CharacterErrorCodes.ACCESS_NOT_FOUND],
  ] as const)(
    'segue as mesmas regras: %s por "%s" (%s) → %s',
    async (id, requester, access, code) => {
      await expect(assertOwnsCharacter(repo, id, requester, access)).rejects.toThrow(code);
    },
  );
});
