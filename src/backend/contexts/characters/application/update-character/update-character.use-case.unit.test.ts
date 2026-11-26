import { beforeEach, describe, expect, it, vi } from 'vitest';

import { storagePathFromAssetUrl } from '@backend/shared/application/remove-replaced-asset';
import { StorageRepository } from '@backend/shared/domain/storage.repo';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { CharacterUpdates, UpdateCharacterUseCase } from './update-character.use-case';

const ASSETS = 'https://images.rpgworldapp.com';
/** The asset host of these tests, as `ownAssetPath` answers in production. */
const ownAssetPath = (url: string, bucket: string) => storagePathFromAssetUrl(url, bucket, ASSETS);

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
    useCase = new UpdateCharacterUseCase(repo, undefined, undefined, ownAssetPath);

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

  it('salvaguardas: salvar outro campo não grava nenhuma; ausente não vira false', async () => {
    expect((await update({ ac: 15 })).savingThrowProficiencies).toEqual({});
    expect((await update({ level: 3 })).savingThrowProficiencies).toEqual({});
  });

  it('salvaguardas: guarda só as definidas à mão, e a que sai do mapa volta a herdar', async () => {
    expect(
      (await update({ savingThrowProficiencies: { STR: false, WIS: true } }))
        .savingThrowProficiencies,
    ).toEqual({ STR: false, WIS: true });
    // Outro campo depois: as duas continuam, e só elas
    expect((await update({ ac: 12 })).savingThrowProficiencies).toEqual({ STR: false, WIS: true });
    expect(
      (await update({ savingThrowProficiencies: { WIS: true } })).savingThrowProficiencies,
    ).toEqual({ WIS: true });
  });

  it('proficiências: nada gravado até a pessoa mexer; depois guarda o mapa como veio', async () => {
    expect((await update({ ac: 15 })).proficiencies).toBeUndefined();

    const proficiencies = {
      armor: { off: ['heavy'] },
      languages: { added: ['elvish'], own: ['Língua dos Corvos'] },
    };
    expect((await update({ proficiencies })).proficiencies).toEqual(proficiencies);
    // Trocar de classe não mexe nelas
    expect((await update({ class: 'wizard' })).proficiencies).toEqual(proficiencies);
    expect((await update({ proficiencies: {} })).proficiencies).toEqual({});
  });

  it('aplica campos simples (classe, dados de vida)', async () => {
    const updated = await update({
      class: 'Wizard',
      hitDice: { die: 'd6', spent: 2 },
    });

    expect(updated.class).toBe('Wizard');
    expect(updated.hitDice).toEqual({ die: 'd6', spent: 2 });
  });

  describe('dados de vida no formato antigo (aba aberta ou fila offline de antes)', () => {
    it('guarda o dado e os gastos, pelo nível do personagem', async () => {
      await update({ level: 3 });

      const updated = await update({ hitDice: { total: '3d6', current: 2 } });

      expect(updated.hitDice).toEqual({ die: 'd6', spent: 1 });
    });

    it('com o nível no mesmo salvamento, conta pelo nível que chega', async () => {
      const updated = await update({ level: 5, hitDice: { total: '4d8', current: 2 } });

      expect(updated.hitDice).toEqual({ die: 'd8', spent: 3 });
    });

    it('sem dado no total, guarda só os gastos', async () => {
      const updated = await update({ hitDice: { total: '', current: 0 } });

      expect(updated.hitDice).toEqual({ spent: 1 });
      expect(updated.hitDice).not.toHaveProperty('die');
    });
  });

  it('mudar o nível não mexe nos dados de vida gastos', async () => {
    await update({ level: 5, hitDice: { die: 'd8', spent: 5 } });

    expect((await update({ level: 3 })).hitDice).toEqual({ die: 'd8', spent: 5 });
    expect((await update({ level: 5 })).hitDice).toEqual({ die: 'd8', spent: 5 });
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

  describe('fundo da ficha substituído', () => {
    const url = (version: string) =>
      `https://images.rpgworldapp.com/avatars/owner/characters/char-a-background-${version}.webp`;

    async function withBackground() {
      const storage = { upload: vi.fn(), remove: vi.fn().mockResolvedValue(undefined) };
      const repository = new InMemoryCharacterRepository();
      const character = makeCharacter('char-a', 'owner');
      character.sheetBackgroundUrl = url('v1');
      await repository.save(character);
      return {
        storage,
        useCase: new UpdateCharacterUseCase(
          repository,
          storage as unknown as StorageRepository,
          undefined,
          ownAssetPath,
        ),
      };
    }

    it.each([
      ['trocar', url('v2')],
      ['remover', ''],
    ])('%s o fundo apaga o arquivo anterior', async (_action, sheetBackgroundUrl) => {
      const { storage, useCase } = await withBackground();

      const saved = await useCase.execute({
        id: 'char-a',
        ownerUsername: 'owner',
        updates: { sheetBackgroundUrl },
      });

      expect(saved.sheetBackgroundUrl).toBe(sheetBackgroundUrl);
      expect(storage.remove).toHaveBeenCalledWith(
        'avatars',
        'owner/characters/char-a-background-v1.webp',
      );
    });

    it('salvar outro campo não mexe no fundo', async () => {
      const { storage, useCase } = await withBackground();

      await useCase.execute({ id: 'char-a', ownerUsername: 'owner', updates: { name: 'Novo' } });

      expect(storage.remove).not.toHaveBeenCalled();
    });
  });

  describe('avatar substituído', () => {
    const url = (character: string, version: string) =>
      `https://images.rpgworldapp.com/avatars/owner/characters/${character}-${version}.png`;

    async function setup(previousAvatarUrl?: string) {
      const repo = new InMemoryCharacterRepository();
      const character = makeCharacter('char-a', 'owner');
      character.avatarUrl = previousAvatarUrl;
      await repo.save(character);
      const storage = { remove: vi.fn().mockResolvedValue(undefined) };
      const useCase = new UpdateCharacterUseCase(
        repo,
        storage as unknown as StorageRepository,
        undefined,
        ownAssetPath,
      );
      return { storage, useCase };
    }

    it('apaga o arquivo anterior depois de salvar o novo avatar', async () => {
      const { storage, useCase } = await setup(url('char-a', 'v1'));

      await useCase.execute({
        id: 'char-a',
        ownerUsername: 'owner',
        updates: { avatarUrl: url('char-a', 'v2') },
      });

      expect(storage.remove).toHaveBeenCalledWith('avatars', 'owner/characters/char-a-v1.png');
    });

    it('trocar um avatar novo apaga também a imagem completa dele', async () => {
      const previous =
        'https://images.rpgworldapp.com/avatars/owner/characters/char-a-v1-avatar.webp';
      const { storage, useCase } = await setup(previous);

      await useCase.execute({
        id: 'char-a',
        ownerUsername: 'owner',
        updates: {
          avatarUrl:
            'https://images.rpgworldapp.com/avatars/owner/characters/char-a-v2-avatar.webp',
        },
      });

      expect(storage.remove).toHaveBeenCalledWith(
        'avatars',
        'owner/characters/char-a-v1-avatar.webp',
      );
      expect(storage.remove).toHaveBeenCalledWith('avatars', 'owner/characters/char-a-v1.webp');
    });

    it('trocar um avatar antigo apaga só ele', async () => {
      const { storage, useCase } = await setup(url('char-a', 'v1'));

      await useCase.execute({
        id: 'char-a',
        ownerUsername: 'owner',
        updates: { avatarUrl: url('char-a', 'v2') },
      });

      expect(storage.remove).toHaveBeenCalledTimes(1);
    });

    it('não mexe no storage quando o avatar não faz parte da atualização', async () => {
      const { storage, useCase } = await setup(url('char-a', 'v1'));

      await useCase.execute({ id: 'char-a', ownerUsername: 'owner', updates: { name: 'Novo' } });

      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('não apaga o avatar de outro personagem apontado pela URL antiga', async () => {
      const { storage, useCase } = await setup(url('char-b', 'v1'));

      await useCase.execute({
        id: 'char-a',
        ownerUsername: 'owner',
        updates: { avatarUrl: url('char-a', 'v2') },
      });

      expect(storage.remove).not.toHaveBeenCalled();
    });
  });

  it('junta resources por chave e guarda a edição', async () => {
    const stored = makeCharacter('res-char', 'owner');
    stored.resources = { 'class:monk:ki': { used: 3 }, 'class:monk:x': { used: 1 } };
    await repo.save(stored);

    const result = await useCase.execute({
      id: 'res-char',
      ownerUsername: 'owner',
      updates: { edition: '2024', resources: { 'class:monk:ki': { used: 1 } } },
    });

    expect(result.resources).toEqual({
      'class:monk:ki': { used: 1 },
      'class:monk:x': { used: 1 },
    });
    expect(result.edition).toBe('2024');
    expect(result.toJSON()).toMatchObject({ edition: '2024', resources: result.resources });
  });

  it('chave custom enviada sem a caixinha é excluída; as outras ficam', async () => {
    const own = (name: string) => ({
      used: 0,
      custom: { name, max: 1, recovery: [], source: 'manual' as const },
    });
    const A = 'custom:0193a1b2-0000-7000-8000-000000000001';
    const B = 'custom:0193a1b3-0000-7000-8000-000000000002';
    const stored = makeCharacter('own-char', 'owner');
    stored.resources = { 'class:monk:ki': { used: 3 }, [A]: own('Anel'), [B]: own('Amuleto') };
    await repo.save(stored);

    const result = await useCase.execute({
      id: 'own-char',
      ownerUsername: 'owner',
      updates: { resources: { [A]: { used: 0 } } },
    });

    expect(result.resources).toEqual({ 'class:monk:ki': { used: 3 }, [B]: own('Amuleto') });
  });

  describe('limite de caixinhas', () => {
    const boxes = (n: number) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`class:monk:r${i}`, { used: 0 }]));

    beforeEach(async () => {
      const full = makeCharacter('full-char', 'owner');
      full.resources = boxes(200);
      await repo.save(full);
    });

    it('recusa uma chave nova quando já há 200', async () => {
      await expect(
        useCase.execute({
          id: 'full-char',
          ownerUsername: 'owner',
          updates: { resources: { 'class:monk:new': { used: 0 } } },
        }),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.RESOURCE_LIMIT });
    });

    it('aceita sobrescrever uma chave existente quando há 200', async () => {
      const result = await useCase.execute({
        id: 'full-char',
        ownerUsername: 'owner',
        updates: { resources: { 'class:monk:r0': { used: 4 } } },
      });

      expect(Object.keys(result.resources ?? {})).toHaveLength(200);
      expect(result.resources?.['class:monk:r0']).toEqual({ used: 4 });
    });
  });

  // As the profile avatar: any other URL would show someone else's file, or a tracker, on the sheet
  describe('imagens da ficha', () => {
    const own = `${ASSETS}/avatars/owner-1/characters/char-1-v2.webp`;

    it.each<[string, CharacterUpdates]>([
      ['avatar de outro servidor', { avatarUrl: 'https://tracker.example/pixel.png' }],
      ['fundo de outro servidor', { sheetBackgroundUrl: 'https://tracker.example/bg.png' }],
      [
        'avatar da pasta de outra pessoa',
        { avatarUrl: `${ASSETS}/avatars/someone/characters/char-1-v1.webp` },
      ],
      [
        'avatar de outro personagem',
        { avatarUrl: `${ASSETS}/avatars/owner-1/characters/char-2-v1.webp` },
      ],
      [
        'fundo fora do bucket',
        { sheetBackgroundUrl: `${ASSETS}/other/owner-1/characters/char-1-background-v1.webp` },
      ],
      // The bucket has to come right after the host, not anywhere further along the path
      [
        'avatar de outro bucket com "avatars" no meio do caminho',
        { avatarUrl: `${ASSETS}/other/x/avatars/owner-1/characters/char-1-v1.webp` },
      ],
    ])('recusa %s e não salva', async (_label, updates) => {
      await expect(
        useCase.execute({ id: 'char-1', ownerUsername: 'owner-1', updates }),
      ).rejects.toMatchObject({ code: CharacterErrorCodes.IMAGE_INVALID, kind: 'validation' });
      expect((await repo.findById('char-1'))!.avatarUrl).toBeUndefined();
    });

    it('aceita o que foi enviado para este personagem, e tirar a imagem', async () => {
      const saved = await useCase.execute({
        id: 'char-1',
        ownerUsername: 'owner-1',
        updates: { avatarUrl: own, sheetBackgroundUrl: '' },
      });
      expect(saved.avatarUrl).toBe(own);
    });

    // Saved before the check: the sheet sends it back with every save
    it('uma imagem de fora salva antes continua valendo se voltar igual', async () => {
      const stored = (await repo.findById('char-1'))!;
      stored.avatarUrl = 'https://old.example/a.png';
      await repo.save(stored);

      const saved = await useCase.execute({
        id: 'char-1',
        ownerUsername: 'owner-1',
        updates: { avatarUrl: 'https://old.example/a.png', name: 'Novo' },
      });
      expect(saved.name).toBe('Novo');
    });
  });

  describe('revisão', () => {
    const save = (updates: CharacterUpdates, revision?: number) =>
      useCase.execute({ id: 'char-1', ownerUsername: 'owner-1', updates, revision });

    it('sem revisão salva por cima, como antes, e devolve a revisão nova', async () => {
      expect((await save({ ac: 20 })).revision).toBe(1);
      expect((await save({ ac: 18 })).revision).toBe(2);
    });

    it('com a revisão vista salva e sobe a revisão', async () => {
      const result = await save({ ac: 20 }, 0);
      expect(result.revision).toBe(1);
      expect(result.ac).toBe(20);
    });

    it('com revisão antiga responde conflito com a revisão de agora e não grava', async () => {
      await save({ ac: 20 }, 0);

      await expect(save({ ac: 18 }, 0)).rejects.toMatchObject({
        code: CharacterErrorCodes.CONFLICT,
        kind: 'conflict',
        details: { code: 'conflict', revision: 1 },
      });
      expect(((await repo.findById('char-1')) as DnD5eCharacter).ac).toBe(20);
    });

    it('escrita de outro entre a leitura e a gravação: lê de novo e aplica por cima', async () => {
      // The first compare-and-set loses the race once, the second one goes through
      const saveIfUnchanged = repo.saveIfUnchanged.bind(repo);
      const spy = vi
        .spyOn(repo, 'saveIfUnchanged')
        .mockResolvedValueOnce(false)
        .mockImplementation(saveIfUnchanged);

      expect((await save({ ac: 15 }, 0)).ac).toBe(15);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('perdendo a corrida sempre, com revisão: desiste com conflito', async () => {
      const spy = vi.spyOn(repo, 'saveIfUnchanged').mockResolvedValue(false);

      await expect(save({ ac: 15 }, 0)).rejects.toMatchObject({
        code: CharacterErrorCodes.CONFLICT,
        details: { code: 'conflict', revision: 0 },
      });
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('perdendo a corrida sempre, sem revisão (app publicado): grava por cima como antes', async () => {
      vi.spyOn(repo, 'saveIfUnchanged').mockResolvedValue(false);
      const upsert = vi.spyOn(repo, 'save');

      const result = await save({ ac: 15 });
      expect(result.ac).toBe(15);
      expect(result.revision).toBe(1);
      expect(upsert).toHaveBeenCalledTimes(1);
    });

    describe('estado de jogo não sobe a revisão', () => {
      it.each<[string, CharacterUpdates]>([
        ['PV atual', { hpCurrent: 3 }],
        ['PV temporário', { hpTemp: 5 }],
        ['testes contra a morte', { deathSaves: { successes: 1, failures: 2 } }],
        ['avatar', { avatarUrl: `${ASSETS}/avatars/owner-1/characters/char-1-v1.webp` }],
        [
          'fundo',
          { sheetBackgroundUrl: `${ASSETS}/avatars/owner-1/characters/char-1-background-v1.webp` },
        ],
      ])('%s', async (_label, updates) => {
        expect((await save(updates, 0)).revision).toBe(0);
      });

      it('espaços, pontos, recursos e dados de vida gastos; o máximo sobe', async () => {
        await save({
          spellSlots: { '1': { max: 2, used: 0 } },
          spellPoints: { max: 4, current: 4 },
        });
        await save({ hitDice: { die: 'd8', spent: 0 } });
        const base = (await repo.findById('char-1'))!.revision;

        await save({ spellSlots: { '1': { max: 2, used: 1 } } }, base);
        await save({ spellPoints: { max: 4, current: 1 } }, base);
        await save({ hitDice: { die: 'd8', spent: 1 } }, base);
        // Spending a class box the first time creates its entry: still game state
        await save({ resources: { 'class:monk:r0': { used: 1 } } }, base);
        expect((await repo.findById('char-1'))!.revision).toBe(base);

        expect((await save({ spellSlots: { '1': { max: 3, used: 1 } } }, base)).revision).toBe(
          base + 1,
        );
        expect(
          (await save({ resources: { 'class:monk:r0': { used: 1, hidden: true } } }, base + 1))
            .revision,
        ).toBe(base + 2);
      });

      it('dados de vida: do formato antigo para o novo com o mesmo dado não sobe', async () => {
        // A sheet as it is stored from before 2026-11: the repository keeps what it is given
        const stored = (await repo.findById('char-1')) as DnD5eCharacter;
        stored.hitDice = { total: '1d8', current: 1 } as never;
        await repo.save(stored);
        const base = (await repo.findById('char-1'))!.revision;

        expect((await save({ hitDice: { die: 'd8', spent: 0 } }, base)).revision).toBe(base);
        expect((await save({ hitDice: { die: 'd8', spent: 1 } }, base)).revision).toBe(base);
      });

      it('dados de vida: trocar o dado é edição da ficha e sobe', async () => {
        await save({ hitDice: { die: 'd8', spent: 1 } });
        const base = (await repo.findById('char-1'))!.revision;

        expect((await save({ hitDice: { die: 'd10', spent: 1 } }, base)).revision).toBe(base + 1);
        // The legacy shape with another die counts the same
        expect((await save({ hitDice: { total: '1d12', current: 0 } }, base + 1)).revision).toBe(
          base + 2,
        );
      });

      it('o dano do mestre não dá conflito no rascunho da CA', async () => {
        const seen = (await repo.findById('char-1'))!.revision;
        await save({ hpCurrent: 2 }); // the GM, from combat
        const result = await save({ ac: 19 }, seen);
        expect(result.ac).toBe(19);
        expect(result.hp.current).toBe(2);
      });
    });
  });
});
