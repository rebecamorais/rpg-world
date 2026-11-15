import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { describe, expect, it } from 'vitest';

import { SheetSourceContext } from '@frontend/hooks/useSheetSource';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CombatStatsSection from './CombatStatsSection';

const character = {
  ...createDnD5eCharacter('owner', 'Thor', { hpCurrent: 9, hpMax: 12, ac: 14, initiative: 2 }),
  id: 'c1',
  hitDice: { total: '1d10', current: 1 },
  spellcastingSystem: 'points',
  spellPoints: { current: 3, max: 6 },
} as DnD5eCharacter;

function renderCombat(overrides: Partial<DnD5eCharacter> = {}) {
  return renderWithCharacter(<CombatStatsSection />, { ...character, ...overrides });
}

describe('CombatStatsSection', () => {
  it('mostra CA, iniciativa, deslocamento e PV atuais', () => {
    renderCombat();

    expect(screen.getByLabelText('AC')).toHaveValue('14');
    expect(screen.getByLabelText('Initiative')).toHaveValue('2');
    expect(screen.getByLabelText('Speed')).toHaveValue('9');
    expect(screen.getByLabelText('Hit Points')).toHaveValue('9');
  });

  it.each([
    ['AC', 'ac', '17', 17],
    ['Initiative', 'initiative', '-1', -1],
    ['Speed', 'speed', '7.5', 7.5],
  ])('edita %s no rascunho', (label, field, typed, expected) => {
    const { draft, isDirty } = renderCombat();

    fireEvent.change(screen.getByLabelText(label), { target: { value: typed } });

    expect(draft()[field as keyof DnD5eCharacter]).toBe(expected);
    expect(isDirty()).toBe(true);
  });

  it('o PV é de jogo: salva na hora, sem passar pelo rascunho', async () => {
    const { sentNow, isDirty } = renderCombat();

    fireEvent.change(screen.getByLabelText('Hit Points'), { target: { value: '4' } });
    expect(sentNow()).toEqual({ hpCurrent: 4 });

    await userEvent.click(screen.getByRole('button', { name: 'Lose 1 HP' }));
    expect(sentNow()).toEqual({ hpCurrent: 8 });
    expect(isDirty()).toBe(false);
  });

  it('gastar um espaço de magia salva na hora, mantendo a capacidade do servidor', async () => {
    const { saveNow, isDirty } = renderCombat({
      spellcastingSystem: 'slots',
      spellSlots: { '1': { max: 2, used: 0 } },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Level 1 slot 1, available' }));

    const patch = saveNow.mock.calls.at(-1)![0] as (c: DnD5eCharacter) => Partial<DnD5eCharacter>;
    // Read on the server copy: a capacity still only in the draft isn't saved with the tap
    expect(patch({ ...character, spellSlots: { '1': { max: 2, used: 0 } } })).toEqual({
      spellSlots: { '1': { max: 2, used: 1 } },
    });
    expect(isDirty()).toBe(false);
  });

  it('apagar o deslocamento deixa o campo vazio, com o erro só ao sair', async () => {
    const user = userEvent.setup();
    const { draft } = renderCombat({ speed: 9 });
    const speed = screen.getByLabelText('Speed');

    await user.clear(speed);
    expect(speed).toHaveValue('');
    expect(screen.queryByText('Enter a number')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByText('Enter a number')).toBeInTheDocument();
    expect(draft().speed).toBe(9);

    await user.type(speed, '7,5');
    expect(draft().speed).toBe(7.5);
    expect(screen.queryByText('Enter a number')).not.toBeInTheDocument();
  });

  it('mostra a percepção passiva junto dos outros números', () => {
    renderCombat();

    // 10 + WIS modifier (10 → +0), no proficiency
    // Icon only: the name opens from the icon, and screen readers hear it before the number
    expect(screen.getByRole('button', { name: 'What is Passive Perception?' })).toBeInTheDocument();
    expect(screen.getByText('Passive Perception:').parentElement).toHaveTextContent('10');
  });

  it('troca o dado de vida', async () => {
    const { draft } = renderCombat();

    await userEvent.click(screen.getByRole('combobox', { name: 'Hit Dice' }));
    await userEvent.click(screen.getByRole('option', { name: '1d12' }));

    expect(draft().hitDice).toEqual({ total: '1d12', current: 1 });
  });

  it('mostra os pontos de magia e salva o gasto na hora', () => {
    const { sentNow, isDirty } = renderCombat();

    const points = screen.getByLabelText('Spell Points');
    expect(points).toHaveValue('3');
    fireEvent.change(points, { target: { value: '5' } });

    expect(sentNow()).toEqual({ spellPoints: { current: 5, max: 6 } });
    expect(isDirty()).toBe(false);
  });

  it('troca o sistema de magia só pela engrenagem, e o card acompanha', async () => {
    const user = userEvent.setup();
    const { draft } = renderCombat();
    expect(screen.queryByRole('combobox', { name: 'System Used' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Configure magic system' }));
    await user.click(screen.getByRole('tab', { name: 'Spell Slots' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(draft().spellcastingSystem).toBe('slots');
    expect(screen.queryByLabelText('Spell Points')).not.toBeInTheDocument();
  });

  it('com espaços de magia, não mostra o campo de pontos', () => {
    renderCombat({ spellcastingSystem: 'slots', spellSlots: { '1': { max: 2, used: 1 } } });

    expect(screen.queryByLabelText('Spell Points')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure magic system' })).toBeInTheDocument();
  });

  describe('configuração de combate', () => {
    async function openConfig(name = 'Configure hit points') {
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name }));
      return { user, dialog: await screen.findByRole('dialog') };
    }

    it('a mudança vai para a ficha na hora, e Concluir só fecha', async () => {
      const { draft, isDirty } = renderCombat();
      const { user } = await openConfig();

      fireEvent.change(screen.getByLabelText('Max Hit Points'), { target: { value: '20' } });
      expect(draft().hpMax).toBe(20);
      expect(isDirty()).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Done' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(draft().hpMax).toBe(20);
    });

    it('a engrenagem da vida abre só a vida, e a da magia só a magia', async () => {
      renderCombat();

      const { user, dialog } = await openConfig();
      expect(dialog).toHaveTextContent('Max Hit Points');
      expect(dialog).not.toHaveTextContent('Spell Slots');
      await user.click(screen.getByRole('button', { name: 'Done' }));

      const magic = (await openConfig('Configure magic system')).dialog;
      expect(magic).toHaveTextContent('Spell Slots');
      expect(magic).not.toHaveTextContent('Max Hit Points');
    });

    it('abrir e concluir sem mudar nada não deixa a ficha com alterações pendentes', async () => {
      const { isDirty } = renderCombat({ spellcastingSystem: undefined });
      const { user } = await openConfig('Configure magic system');

      await user.click(screen.getByRole('button', { name: 'Done' }));

      expect(isDirty()).toBe(false);
    });
  });

  describe('dados de vida restantes', () => {
    const noHitDice = { level: 4, hitDice: undefined } as Partial<DnD5eCharacter>;

    it('sem dados guardados, todos os dados do nível estão disponíveis', () => {
      renderCombat(noHitDice);

      expect(
        screen.getByRole('group', { name: 'Hit dice remaining, 4 of 4 available' }),
      ).toBeInTheDocument();
    });

    it('gastar um dado salva na hora, mantendo o total guardado', async () => {
      const { sentNow } = renderCombat({ level: 4, hitDice: { total: '4d10', current: 4 } });

      await userEvent.click(
        screen.getByRole('button', { name: 'Hit dice remaining 4, available' }),
      );

      expect(sentNow()).toEqual({ hitDice: { total: '4d10', current: 3 } });
    });

    it('sem total guardado, salva o total vazio', async () => {
      const { sentNow } = renderCombat(noHitDice);

      await userEvent.click(
        screen.getByRole('button', { name: 'Hit dice remaining 4, available' }),
      );

      expect(sentNow()).toEqual({ hitDice: { total: '', current: 3 } });
    });

    it('com 0 guardado, nenhum dado disponível e devolver um vai a 1', async () => {
      const { sentNow } = renderCombat({ level: 4, hitDice: { total: '4d8', current: 0 } });
      expect(
        screen.getByRole('group', { name: 'Hit dice remaining, 0 of 4 available' }),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Hit dice remaining 1, spent' }));

      expect(sentNow()).toEqual({ hitDice: { total: '4d8', current: 1 } });
    });

    it('guardado acima do nível mostra só o nível', () => {
      renderCombat({ level: 4, hitDice: { total: '4d8', current: 9 } });

      expect(
        screen.getByRole('group', { name: 'Hit dice remaining, 4 of 4 available' }),
      ).toBeInTheDocument();
    });

    it('somente leitura deixa os dados desabilitados', () => {
      renderWithCharacter(
        <SheetSourceContext.Provider
          value={{ readOnly: true, partyId: null, apiPath: '/x', pagesPath: '/x' }}
        >
          <CombatStatsSection />
        </SheetSourceContext.Provider>,
        { ...character, level: 4 } as DnD5eCharacter,
      );

      expect(
        screen.getByRole('button', { name: 'Hit dice remaining 1, available' }),
      ).toBeDisabled();
    });

    it('marca os alvos de rolagem do descanso', () => {
      const { container } = renderCombat();

      expect(container.querySelector('#sheet-hp')).toBeInTheDocument();
      expect(container.querySelector('#sheet-hit-dice')).toBeInTheDocument();
      expect(container.querySelector('#sheet-spell-slots')).toBeInTheDocument();
    });
  });
});
