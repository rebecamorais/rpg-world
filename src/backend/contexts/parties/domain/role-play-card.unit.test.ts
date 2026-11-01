import { describe, expect, it } from 'vitest';

import { RosterCharacter } from './PartyView';
import { toRolePlayCard } from './role-play-card';

const roster: RosterCharacter = {
  characterId: 'c1',
  ownerId: 'u1',
  name: 'Arani',
  avatarUrl: null,
  race: 'Elfa',
  class: 'Maga',
  level: 1,
  accentColor: null,
};

describe('toRolePlayCard', () => {
  it('calcula as passivas dos atributos e perícias, ignorando o valor salvo na ficha', () => {
    const card = toRolePlayCard(
      roster,
      {
        attributes: { WIS: 16 },
        level: 1,
        skills: { PERCEPTION: { isProficient: true } },
        storedPassivePerception: 10,
      },
      null,
      'bia',
    );

    expect(card.passivePerception).toBe(15);
    expect(card.passiveInsight).toBe(13);
    expect(card.ownerUsername).toBe('bia');
  });

  it('sem sabedoria conta 10, e expertise dobra a proficiência', () => {
    const card = toRolePlayCard(
      { ...roster, level: 5 },
      { attributes: {}, level: 5, skills: { INSIGHT: { isProficient: true, expertise: true } } },
      null,
      null,
    );

    expect(card.passivePerception).toBe(10);
    expect(card.passiveInsight).toBe(16);
  });

  it('sem lore, traço, ideal, vínculo e defeito vêm null', () => {
    const card = toRolePlayCard(roster, { attributes: {}, level: 1, skills: {} }, null, null);

    expect(card).toMatchObject({
      personalityTraits: null,
      ideals: null,
      bonds: null,
      flaws: null,
    });
  });

  it('traz traço, ideal, vínculo e defeito da lore; texto vazio vira null', () => {
    const card = toRolePlayCard(
      roster,
      { attributes: {}, level: 1, skills: {} },
      { personalityTraits: 'Curiosa', ideals: 'Saber', bonds: '', flaws: null },
      null,
    );

    expect(card).toMatchObject({
      personalityTraits: 'Curiosa',
      ideals: 'Saber',
      bonds: null,
      flaws: null,
    });
  });
});
