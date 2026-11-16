import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import SavingThrowsSection from './SavingThrowsSection';

const loaded = vi.hoisted(() => ({ content: null as unknown }));
vi.mock('@frontend/hooks/useClassResources', () => ({
  useClassResources: (edition: unknown, classId: string | null) => ({
    content: edition && classId ? loaded.content : null,
  }),
}));

/** The fighter as the content API sends it, with only what the saving throws read. */
const FIGHTER = {
  classId: 'fighter',
  edition: '2014',
  hitDie: 10,
  proficiencies: {
    savingThrows: ['STR', 'CON'],
    armor: [],
    weapons: [],
    tools: [],
    skills: { count: 2, from: ['ATHLETICS'] },
  },
};

const base = createDnD5eCharacter('o', 'x');

function renderSaves(extra: Partial<DnD5eCharacter> = {}) {
  const character = {
    ...base,
    id: 'c1',
    level: 5,
    class: 'fighter',
    edition: '2014',
    attributes: { ...base.attributes, STR: 14 },
    ...extra,
  } as DnD5eCharacter;
  return renderWithCharacter(<SavingThrowsSection />, character);
}

const row = (label: string) => screen.getByText(label).closest('div')!;
const reset = (label: string) =>
  screen.queryByRole('button', { name: `Set ${label} back to what the class says` });

describe('SavingThrowsSection', () => {
  beforeEach(() => {
    loaded.content = FIGHTER;
  });

  it('ficha nova de Guerreiro em 2014 mostra FOR e CON proficientes sem nada salvo', () => {
    const { draft } = renderSaves();

    expect(screen.getByRole('button', { name: 'Proficient in Strength' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proficient in Constitution' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No proficiency in Dexterity' })).toBeInTheDocument();
    // FOR 14 (+2) com proficiência no nível 5 (+3)
    expect(row('Strength')).toHaveTextContent('+5');
    expect(draft().savingThrowProficiencies).toEqual({});
    expect(reset('Strength')).toBeNull();
  });

  it('tocar grava só aquela salvaguarda, e o botão devolve só ela à classe', async () => {
    const { draft } = renderSaves();

    await userEvent.click(screen.getByRole('button', { name: 'Proficient in Strength' }));

    expect(draft().savingThrowProficiencies).toEqual({ STR: false });
    expect(row('Strength')).toHaveTextContent('+2');
    // CON continua herdada
    expect(screen.getByRole('button', { name: 'Proficient in Constitution' })).toBeInTheDocument();
    expect(reset('Constitution')).toBeNull();

    await userEvent.click(reset('Strength')!);

    expect(draft().savingThrowProficiencies).toEqual({});
    expect(screen.getByRole('button', { name: 'Proficient in Strength' })).toBeInTheDocument();
  });

  it('ficha antiga com as seis salvas mostra o que está salvo, não a classe', () => {
    renderSaves({
      savingThrowProficiencies: {
        STR: false,
        DEX: true,
        CON: false,
        INT: false,
        WIS: false,
        CHA: false,
      },
    });

    expect(screen.getByRole('button', { name: 'No proficiency in Strength' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proficient in Dexterity' })).toBeInTheDocument();
    // Onde o salvo difere da classe dá para voltar; onde é igual, não aparece nada
    expect(reset('Strength')).not.toBeNull();
    expect(reset('Dexterity')).not.toBeNull();
    expect(reset('Wisdom')).toBeNull();
  });

  it('ficha de 2024 herda as salvaguardas do SRD 5.2', () => {
    loaded.content = { ...FIGHTER, edition: '2024' };
    const { draft } = renderSaves({ edition: '2024' });

    expect(screen.getByRole('button', { name: 'Proficient in Strength' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proficient in Constitution' })).toBeInTheDocument();
    expect(draft().savingThrowProficiencies).toEqual({});
  });

  it.each([
    ['sem edição', { edition: undefined }],
    ['em 2024 com conteúdo de 2014', { edition: '2024' as const }],
    ['com classe escrita à mão', { class: 'Cavaleiro Rúnico' }],
  ])('%s: nada é herdado e não há botão de voltar à classe', (_, extra) => {
    if ('class' in extra) loaded.content = null;
    renderSaves({ ...extra, savingThrowProficiencies: { DEX: true } });

    expect(screen.getByRole('button', { name: 'No proficiency in Strength' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proficient in Dexterity' })).toBeInTheDocument();
    expect(reset('Dexterity')).toBeNull();
  });
});
