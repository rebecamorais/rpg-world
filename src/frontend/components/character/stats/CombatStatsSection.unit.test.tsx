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
  hitDice: { die: 'd10', spent: 0 },
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
    await userEvent.click(screen.getByRole('option', { name: 'd12' }));

    expect(draft().hitDice).toEqual({ die: 'd12', spent: 0 });
  });

  it('mostra o dado, e d8 quando a ficha não tem dado', () => {
    const { unmount } = renderCombat({ level: 5 });
    expect(screen.getByRole('combobox', { name: 'Hit Dice' })).toHaveTextContent(/^d10$/);
    unmount();

    renderCombat({ level: 4, hitDice: undefined });
    expect(screen.getByRole('combobox', { name: 'Hit Dice' })).toHaveTextContent(/^d8$/);
  });

  it('ficha no formato antigo: mostra o dado do total e troca gravando o formato novo', async () => {
    const { draft } = renderCombat({ level: 5, hitDice: { total: '5d6', current: 3 } });
    expect(screen.getByRole('combobox', { name: 'Hit Dice' })).toHaveTextContent(/^d6$/);

    await userEvent.click(screen.getByRole('combobox', { name: 'Hit Dice' }));
    await userEvent.click(screen.getByRole('option', { name: 'd12' }));

    expect(draft().hitDice).toEqual({ die: 'd12', spent: 2 });
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
    const remaining = () => screen.getByLabelText('Hit dice remaining');
    const typeRemaining = async (text: string) => {
      const user = userEvent.setup();
      await user.clear(remaining());
      await user.type(remaining(), text);
    };

    it('mostra os restantes e o nível na caixa do dado, sem caixinhas', () => {
      renderCombat({ level: 4, hitDice: { die: 'd10', spent: 1 } });

      expect(remaining()).toHaveValue('3');
      expect(screen.getByTestId('hit-dice-total')).toHaveTextContent('/4');
      expect(screen.getByRole('combobox', { name: 'Hit Dice' })).toHaveTextContent(/^d10$/);
      expect(screen.queryByRole('group', { name: /Hit dice remaining/ })).not.toBeInTheDocument();
    });

    it('sem dados guardados, todos os dados do nível estão disponíveis', () => {
      renderCombat(noHitDice);

      expect(remaining()).toHaveValue('4');
    });

    it('digitar os restantes salva na hora os gastos, mantendo o dado guardado', async () => {
      const { sentNow } = renderCombat({ level: 4, hitDice: { die: 'd10', spent: 0 } });

      await typeRemaining('3');

      expect(sentNow()).toEqual({ hitDice: { die: 'd10', spent: 1 } });
    });

    it('sem dado guardado, salva só os gastos', async () => {
      const { sentNow } = renderCombat(noHitDice);

      await typeRemaining('3');

      expect(sentNow()).toEqual({ hitDice: { spent: 1 } });
    });

    it('com todos gastos mostra 0, e devolver um deixa 3 gastos', async () => {
      const { sentNow } = renderCombat({ level: 4, hitDice: { die: 'd8', spent: 4 } });
      expect(remaining()).toHaveValue('0');

      await typeRemaining('1');

      expect(sentNow()).toEqual({ hitDice: { die: 'd8', spent: 3 } });
    });

    it('gastos acima do nível mostram 0, e digitar grava a partir do que aparece', async () => {
      // Spent 5 at level 5, then went down to 3: what was saved stays for when the level is back
      const { sentNow } = renderCombat({ level: 3, hitDice: { die: 'd8', spent: 5 } });
      expect(remaining()).toHaveValue('0');

      // Giving one back is the player's action: it saves what the field shows
      await typeRemaining('1');
      expect(sentNow()).toEqual({ hitDice: { die: 'd8', spent: 2 } });
    });

    it('não aceita mais dados do que o nível', async () => {
      const { sentNow } = renderCombat({ level: 4, hitDice: { die: 'd8', spent: 2 } });

      await typeRemaining('9');
      await userEvent.tab();

      expect(remaining()).toBeInvalid();
      // Nothing was saved: asking for the last save finds none
      expect(() => sentNow()).toThrow();
    });

    describe('ficha no formato antigo (total e dados restantes)', () => {
      it('digitar os restantes salva o formato novo, com o dado do total', async () => {
        const { sentNow } = renderCombat({ level: 4, hitDice: { total: '4d10', current: 4 } });

        await typeRemaining('3');

        expect(sentNow()).toEqual({ hitDice: { die: 'd10', spent: 1 } });
      });

      it('sem dado no total, salva só os gastos', async () => {
        const { sentNow } = renderCombat({ level: 4, hitDice: { total: '', current: 3 } });
        expect(remaining()).toHaveValue('3');

        await typeRemaining('2');

        expect(sentNow()).toEqual({ hitDice: { spent: 2 } });
      });

      it('com 0 guardado, nenhum dado disponível', () => {
        renderCombat({ level: 4, hitDice: { total: '4d8', current: 0 } });

        expect(remaining()).toHaveValue('0');
      });

      it('guardado acima do nível mostra só o nível', () => {
        renderCombat({ level: 4, hitDice: { total: '4d8', current: 9 } });

        expect(remaining()).toHaveValue('4');
      });
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

      expect(remaining()).toBeDisabled();
    });

    it('o "ir" do descanso cai no campo dos dados restantes', () => {
      const { container } = renderCombat();

      expect(container.querySelector('#sheet-hit-dice [data-rest-focus]')).toBe(remaining());
    });

    it('marca os alvos de rolagem do descanso', () => {
      const { container } = renderCombat();

      expect(container.querySelector('#sheet-hp')).toBeInTheDocument();
      expect(container.querySelector('#sheet-hit-dice')).toBeInTheDocument();
      expect(container.querySelector('#sheet-spell-slots')).toBeInTheDocument();
    });
  });
});
