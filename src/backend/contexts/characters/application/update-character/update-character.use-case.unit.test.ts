import { beforeEach, describe, expect, it } from 'vitest';

import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { CharacterUpdates, UpdateCharacterUseCase } from './update-character.use-case';

const makeCharacter = (id: string, ownerUsername: string) =>
  new DnD5eCharacter({
    id,
    name: id,
    ownerUsername,
    attributes: new Attributes({ STR: 10 }),
    hp: new HealthPoints(10, 10),
    level: 1,
  });

describe('UpdateCharacterUseCase', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: UpdateCharacterUseCase;

  beforeEach(async () => {
    repo = new InMemoryCharacterRepository();
    useCase = new UpdateCharacterUseCase(repo);
    await repo.save(makeCharacter('victim-char', 'victim'));
    await repo.save(makeCharacter('attacker-char', 'attacker'));
  });

  it('ignora campos protegidos (id, ownerUsername, system) vindos do cliente', async () => {
    const maliciousUpdates = {
      id: 'victim-char',
      ownerUsername: 'victim',
      system: 'other',
      name: 'Renamed',
    } as unknown as CharacterUpdates;

    const result = await useCase.execute({
      id: 'attacker-char',
      ownerUsername: 'attacker',
      updates: maliciousUpdates,
    });

    expect(result.id).toBe('attacker-char');
    expect(result.ownerUsername).toBe('attacker');
    expect(result.system).toBe('DnD_5e');
    expect(result.name).toBe('Renamed');

    const victim = await repo.findById('victim-char');
    expect(victim?.name).toBe('victim-char');
    expect(victim?.ownerUsername).toBe('victim');
  });

  it('ignora chaves desconhecidas', async () => {
    const result = await useCase.execute({
      id: 'attacker-char',
      ownerUsername: 'attacker',
      updates: { lore: 'x', toJSON: 'x' } as unknown as CharacterUpdates,
    });

    expect(typeof result.toJSON).toBe('function');
    expect(result.lore).not.toBe('x');
  });
});
