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

describe('UpdateCharacterUseCase — campos e dono', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: UpdateCharacterUseCase;

  beforeEach(async () => {
    repo = new InMemoryCharacterRepository();
    useCase = new UpdateCharacterUseCase(repo);

    const char = new DnD5eCharacter({
      id: 'char-1',
      name: 'Test',
      ownerUsername: 'owner-1',
      attributes: new Attributes({ STR: 10 }),
      hp: new HealthPoints(10, 10),
      level: 1,
    });
    await repo.save(char);
  });

  it('deve atualizar múltiplos campos de uma só vez', async () => {
    await useCase.execute({
      id: 'char-1',
      ownerUsername: 'owner-1',
      updates: {
        name: 'Test Updated',
        hpCurrent: 5,
        accentColor: '#ff4444',
      },
    });

    const updated = (await repo.findById('char-1')) as DnD5eCharacter;
    expect(updated.name).toBe('Test Updated');
    expect(updated.hp.status.current).toBe(5);
    expect(updated.accentColor).toBe('#ff4444');
  });

  async function update(updates: CharacterUpdates) {
    await useCase.execute({ id: 'char-1', ownerUsername: 'owner-1', updates });
    return (await repo.findById('char-1')) as DnD5eCharacter;
  }

  it('aplica nível, com mínimo 1', async () => {
    expect((await update({ level: 7 })).level).toBe(7);
    expect((await update({ level: 0 })).level).toBe(1);
  });

  it('mantém o nível quando ele não vem na atualização', async () => {
    await update({ level: 4 });
    expect((await update({ name: 'Other' })).level).toBe(4);
  });

  it('atualiza só o PV máximo, preservando o atual', async () => {
    await update({ hpCurrent: 6 });

    const { hp } = await update({ hpMax: 20 });

    expect(hp.status).toMatchObject({ current: 6, max: 20 });
  });

  it('mantém os PV quando eles não vêm na atualização', async () => {
    await update({ hpCurrent: 4, hpMax: 12 });

    const { hp } = await update({ name: 'Other' });

    expect(hp.status).toMatchObject({ current: 4, max: 12 });
  });

  it('atualiza só os atributos enviados', async () => {
    const { attributes } = await update({ attributes: { STR: 16, WIS: 8 } });

    expect(attributes.get('STR')).toBe(16);
    expect(attributes.get('WIS')).toBe(8);
    expect(attributes.get('DEX')).toBe(10);
  });

  it('junta perícias novas às existentes', async () => {
    await update({ skills: { ATHLETICS: { isProficient: true } } });

    const { skills } = await update({
      skills: { STEALTH: { isProficient: true, expertise: true } },
    });

    expect(skills).toEqual({
      ATHLETICS: { isProficient: true },
      STEALTH: { isProficient: true, expertise: true },
    });
  });

  it('substitui as proficiências em salvaguardas', async () => {
    const saves = { STR: true, DEX: false, CON: true, INT: false, WIS: false, CHA: false };

    expect((await update({ savingThrowProficiencies: saves })).savingThrowProficiencies).toEqual(
      saves,
    );
  });

  it('aplica campos simples (classe, dados de vida, moedas)', async () => {
    const updated = await update({
      class: 'Wizard',
      hitDice: { total: '3d6', current: 2 },
      coins: { cp: 1, sp: 2, ep: 0, gp: 30, pp: 0 },
    });

    expect(updated.class).toBe('Wizard');
    expect(updated.hitDice).toEqual({ total: '3d6', current: 2 });
    expect(updated.coins).toMatchObject({ gp: 30 });
  });

  it('não deve permitir alteração se não for o dono', async () => {
    await expect(
      useCase.execute({
        id: 'char-1',
        ownerUsername: 'hacker-user',
        updates: { name: 'Hacked' },
      }),
    ).rejects.toThrowError('character_error_update_unauthorized');
  });
});
