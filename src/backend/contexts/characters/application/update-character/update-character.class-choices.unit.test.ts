import { beforeEach, describe, expect, it } from 'vitest';

import { getClassCatalog } from '@backend/contexts/classes/infrastructure/srd-classes';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import {
  type CharacterSkill,
  DnD5eCharacter,
  type SkillKey,
} from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { type CharacterUpdates, UpdateCharacterUseCase } from './update-character.use-case';

const ID = 'char-choices';
const OWNER = 'owner-1';

/** Resolving and dismissing the class's picks on the sheet (phase 3.4). */
describe('UpdateCharacterUseCase: escolhas da classe na ficha', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: UpdateCharacterUseCase;

  const seed = (options: {
    edition?: Edition;
    classStr?: string;
    classChoices?: Record<string, string[]>;
    skills?: Partial<Record<SkillKey, CharacterSkill>>;
    dismissedChoices?: string[];
  }) =>
    repo.save(
      new DnD5eCharacter({
        id: ID,
        name: 'Hero',
        ownerUsername: OWNER,
        attributes: new Attributes(),
        hp: new HealthPoints(8, 8),
        level: 1,
        // A sheet born with class picks; a sheet from before them has no key at all
        classChoices: {},
        ...options,
      }),
    );
  const save = (updates: CharacterUpdates) =>
    useCase.execute({ id: ID, ownerUsername: OWNER, updates });
  const stored = async () => (await repo.findById(ID)) as DnD5eCharacter;

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
    useCase = new UpdateCharacterUseCase(repo, undefined, getClassCatalog());
  });

  it('resolver a que faltava: guarda as três e marca a perícia nova', async () => {
    await seed({
      edition: '2014',
      classStr: 'bard',
      classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY'] },
      skills: { ARCANA: { isProficient: true }, HISTORY: { isProficient: true } },
    });

    await save({ classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'] } });

    const character = await stored();
    expect(character.classChoices).toEqual({
      '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'],
    });
    expect(character.skills.STEALTH).toEqual({ isProficient: true });
  });

  it('marcar a perícia escolhida mantém a especialização que ela já tinha', async () => {
    await seed({
      edition: '2014',
      classStr: 'bard',
      skills: { STEALTH: { isProficient: true, expertise: true } },
    });

    await save({ classChoices: { '2014/bard/skills': ['STEALTH'] } });

    expect((await stored()).skills.STEALTH).toEqual({ isProficient: true, expertise: true });
  });

  it('confere como na criação: fora da lista, repetida e em excesso ficam de fora', async () => {
    await seed({ edition: '2014', classStr: 'barbarian' });

    await save({
      classChoices: {
        // Arcana is not a Barbarian's, Athletics twice counts once, and only 2 are asked
        '2014/barbarian/skills': ['ARCANA', 'ATHLETICS', 'ATHLETICS', 'NATURE', 'SURVIVAL'],
      },
    });

    const character = await stored();
    expect(character.classChoices).toEqual({ '2014/barbarian/skills': ['ATHLETICS', 'NATURE'] });
    expect(Object.keys(character.skills).sort()).toEqual(['ATHLETICS', 'NATURE']);
  });

  it('ferramenta fora do tipo que a classe pede fica de fora', async () => {
    await seed({ edition: '2014', classStr: 'bard' });

    await save({ classChoices: { '2014/bard/tools': ['smith-s-tools', 'lute'] } });

    const character = await stored();
    expect(character.classChoices).toEqual({ '2014/bard/tools': ['lute'] });
    expect(character.skills).toEqual({});
  });

  it('escolha de outra classe não é gravada, e as já guardadas dela ficam como estão', async () => {
    await seed({
      edition: '2014',
      classStr: 'rogue',
      classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'] },
    });

    await save({
      classChoices: {
        '2014/bard/skills': ['ATHLETICS'],
        '2014/rogue/skills': ['STEALTH', 'ACROBATICS'],
      },
    });

    expect((await stored()).classChoices).toEqual({
      '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'],
      '2014/rogue/skills': ['STEALTH', 'ACROBATICS'],
    });
  });

  it('troca de classe no mesmo salvamento: confere pela classe que está sendo salva', async () => {
    await seed({ edition: '2014', classStr: 'bard' });

    await save({ class: 'rogue', classChoices: { '2014/rogue/skills': ['STEALTH'] } });

    expect((await stored()).classChoices).toEqual({ '2014/rogue/skills': ['STEALTH'] });
  });

  it('escolha enviada sem nenhuma válida tira as dela; a perícia continua marcada', async () => {
    await seed({
      edition: '2014',
      classStr: 'bard',
      classChoices: { '2014/bard/skills': ['ARCANA'], '2014/bard/tools': ['lute'] },
      skills: { ARCANA: { isProficient: true } },
    });

    await save({ classChoices: { '2014/bard/skills': [] } });

    const character = await stored();
    expect(character.classChoices).toEqual({ '2014/bard/tools': ['lute'] });
    // A pick taken out leaves the skill as the sheet has it: unmarking is the skills list's
    expect(character.skills.ARCANA).toEqual({ isProficient: true });
  });

  it.each([
    ['sem edição', { classStr: 'bard' }],
    ['em 2024', { edition: '2024' as const, classStr: 'bard' }],
    ['com classe escrita à mão', { edition: '2014' as const, classStr: 'Bardo das Sombras' }],
  ])('%s: nada da escolha é gravado', async (_case, options) => {
    await seed(options);

    await save({ classChoices: { '2014/bard/skills': ['ARCANA'] } });

    const character = await stored();
    expect(character.classChoices).toEqual({});
    expect(character.skills).toEqual({});
  });

  it('dispensa: guarda a lista como veio, cada uma uma vez', async () => {
    await seed({ edition: '2014', classStr: 'bard' });

    await save({ dismissedChoices: ['2014/bard/skills', '2014/bard/skills', '2014/bard/tools'] });

    expect((await stored()).dismissedChoices).toEqual(['2014/bard/skills', '2014/bard/tools']);
  });

  it('salvar outro campo não mexe nas escolhas nem nas dispensas', async () => {
    const classChoices = { '2014/bard/skills': ['ARCANA'] };
    await seed({
      edition: '2014',
      classStr: 'bard',
      classChoices,
      dismissedChoices: ['2014/bard/tools'],
    });

    await save({ name: 'Renamed', class: 'rogue' });

    const character = await stored();
    expect(character.classChoices).toEqual(classChoices);
    expect(character.dismissedChoices).toEqual(['2014/bard/tools']);
  });
  it('ficha de antes das escolhas (sem classChoices): nada muda, nem as perícias marcadas à mão', async () => {
    await seed({
      edition: '2014',
      classStr: 'bard',
      classChoices: undefined,
      skills: { ARCANA: { isProficient: true } },
    });

    await save({ classChoices: { '2014/bard/skills': ['STEALTH'] } });

    const character = await stored();
    expect(character.classChoices).toBeUndefined();
    expect(character.skills).toEqual({ ARCANA: { isProficient: true } });
  });

  it('tirar a última escolha mantém a chave vazia: a ficha continua sendo das que têm escolhas', async () => {
    await seed({
      edition: '2014',
      classStr: 'bard',
      classChoices: { '2014/bard/skills': ['ARCANA'] },
    });

    await save({ classChoices: { '2014/bard/skills': [] } });

    expect((await stored()).classChoices).toEqual({});
  });
});
