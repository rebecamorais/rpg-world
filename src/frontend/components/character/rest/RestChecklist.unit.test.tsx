import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCharacterActions } from '@frontend/context/CharacterContext';
import { resolvePatch } from '@frontend/hooks/useDraft';

import { buildResourceBoxes } from '@shared/systems/dnd5e/class-resources';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { MONK } from '../resources/fixtures';
import { RestButtons } from './RestButtons';

const sheet = vi.hoisted(() => ({ readOnly: false }));

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@frontend/hooks/useSheetSource', () => ({
  useSheetSource: () => ({ readOnly: sheet.readOnly }),
}));
vi.mock('../resources/useResourceBoxes', async () => {
  const { useLoadedCharacter } = await import('@frontend/context/CharacterContext');
  return {
    useResourceBoxes: () => {
      const character = useLoadedCharacter();
      return {
        content: MONK,
        boxes: buildResourceBoxes({
          content: MONK,
          subclassId: null,
          level: character.level,
          attributes: character.attributes,
          state: character.resources,
        }),
      };
    },
  };
});

const monk = () => ({
  ...createDnD5eCharacter('owner', 'Thor'),
  id: 'c1',
  level: 5,
  attributes: { ...createDnD5eCharacter('owner', 'Thor').attributes, CON: 14 },
  hitDice: { total: '5d8', current: 3 },
});

const scrollIntoView = vi.fn();

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  sheet.readOnly = false;
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => scrollIntoView.mockClear());

describe('RestChecklist', () => {
  it('lista os itens do descanso curto e conta o progresso', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, monk());
    await user.click(screen.getByRole('button', { name: 'Short rest' }));

    expect(screen.getByText('Roll d8 +2 per hit die spent (3 left)')).toBeInTheDocument();
    expect(screen.getByText('Ki returns: all')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Short rest · 0 of 3' })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /Ki returns/ }));
    expect(screen.getByRole('complementary', { name: 'Short rest · 1 of 3' })).toBeInTheDocument();
  });

  it('abrir leva o foco ao título da lista', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, monk());
    await user.click(screen.getByRole('button', { name: 'Short rest' }));

    expect(screen.getByRole('heading', { name: /^Short rest · / })).toHaveFocus();
  });

  it('o dado do curto vem do dado da ficha, não do da classe', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, { ...monk(), hitDice: { total: '5d10', current: 3 } });
    await user.click(screen.getByRole('button', { name: 'Short rest' }));

    expect(screen.getByText('Roll d10 +2 per hit die spent (3 left)')).toBeInTheDocument();
  });

  it('ficha sem dado escolhido usa o dado da classe', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, { ...monk(), hitDice: { total: '', current: 3 } });
    await user.click(screen.getByRole('button', { name: 'Short rest' }));

    expect(screen.getByText('Roll d8 +2 per hit die spent (3 left)')).toBeInTheDocument();
  });

  it('ficha com pontos de magia (o padrão) lembra deles no longo', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, { ...monk(), spellPoints: { max: 6, current: 1 } });
    await user.click(screen.getByRole('button', { name: 'Long rest' }));

    expect(screen.getByText('Spell points return')).toBeInTheDocument();
    expect(screen.queryByText('Spell slots return')).toBeNull();
  });

  it('sem pontos nem espaços de magia, o longo não fala de magia', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, {
      ...monk(),
      spellcastingSystem: 'slots',
      spellSlots: { '1': { max: 0, used: 0 } },
    });
    await user.click(screen.getByRole('button', { name: 'Long rest' }));

    expect(screen.queryByText('Spell slots return')).toBeNull();
    expect(screen.queryByText('Spell points return')).toBeNull();
  });

  it('ficha com espaços de magia lembra deles no longo', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, {
      ...monk(),
      spellcastingSystem: 'slots',
      spellSlots: { '1': { max: 2, used: 1 } },
    });
    await user.click(screen.getByRole('button', { name: 'Long rest' }));

    expect(screen.getByText('Spell slots return')).toBeInTheDocument();
    expect(screen.queryByText('Spell points return')).toBeNull();
  });

  it('"Terminei" fecha e devolve o foco ao botão que abriu', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, monk());
    const opener = screen.getByRole('button', { name: 'Long rest' });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('complementary')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('Esc fecha e reabrir começa sem nada marcado', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, monk());
    const opener = screen.getByRole('button', { name: 'Short rest' });
    await user.click(opener);
    await user.click(screen.getAllByRole('checkbox')[0]);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('complementary')).toBeNull();
    expect(opener).toHaveFocus();

    await user.click(opener);
    expect(screen.getAllByRole('checkbox').every((c) => !(c as HTMLInputElement).checked)).toBe(
      true,
    );
  });

  it('abrir um descanso enquanto o outro está aberto troca a lista', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, monk());
    await user.click(screen.getByRole('button', { name: 'Short rest' }));
    await user.click(screen.getByRole('button', { name: 'Long rest' }));

    expect(screen.getAllByRole('complementary')).toHaveLength(1);
    expect(screen.getByText('Full HP')).toBeInTheDocument();
    expect(screen.getByText('Recover 2 hit dice')).toBeInTheDocument();
  });

  it('"ir" rola até o bloco, foca o primeiro campo e recolhe a faixa', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCharacter(<RestButtons />, monk());
    const target = document.createElement('div');
    target.id = 'sheet-hit-dice';
    const inner = document.createElement('button');
    inner.textContent = 'dado';
    target.appendChild(inner);
    container.appendChild(target);

    await user.click(screen.getByRole('button', { name: 'Short rest' }));
    await user.click(screen.getAllByRole('button', { name: /^go/ })[0]);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    expect(scrollIntoView.mock.contexts[0]).toBe(target);
    expect(screen.getByRole('button', { name: 'dado' })).toHaveFocus();
    expect(screen.getByRole('button', { name: /Short rest · / })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('"ir" foca o campo marcado, não a engrenagem que vem antes', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCharacter(<RestButtons />, monk());
    const target = document.createElement('div');
    target.id = 'sheet-hp';
    const gear = document.createElement('button');
    gear.textContent = 'engrenagem';
    const field = document.createElement('input');
    field.setAttribute('aria-label', 'PV');
    field.setAttribute('data-rest-focus', '');
    target.append(gear, field);
    container.appendChild(target);

    await user.click(screen.getByRole('button', { name: 'Long rest' }));
    await user.click(screen.getByRole('button', { name: 'go: Full HP' }));

    expect(screen.getByRole('textbox', { name: 'PV' })).toHaveFocus();
  });

  it('Esc que fecha um diálogo ou popover da ficha não fecha a checklist', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCharacter(<RestButtons />, monk());
    await user.click(screen.getByRole('button', { name: 'Short rest' }));

    // Focus inside another layer (a dialog open on the sheet)
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const inner = document.createElement('button');
    inner.textContent = 'dentro';
    dialog.appendChild(inner);
    container.appendChild(dialog);
    inner.focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('complementary')).toBeInTheDocument();

    // A layer that already handled the Esc (Radix calls preventDefault in the capture phase)
    dialog.remove();
    const handled = (event: KeyboardEvent) => event.preventDefault();
    document.addEventListener('keydown', handled, { capture: true });
    try {
      await user.keyboard('{Escape}');
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    } finally {
      document.removeEventListener('keydown', handled, { capture: true });
    }
  });

  it('"ir" sem o bloco na tela não quebra e recolhe a faixa', async () => {
    const user = userEvent.setup();
    renderWithCharacter(<RestButtons />, monk());
    await user.click(screen.getByRole('button', { name: 'Short rest' }));
    await user.click(screen.getAllByRole('button', { name: /^go/ })[1]);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Short rest · / })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  describe('com a barra de salvar (rascunho aberto)', () => {
    // A sheet edit, which opens the save bar under the checklist
    function EditAc() {
      const { update } = useCharacterActions();
      return (
        <button type="button" onClick={() => update({ ac: 15 })}>
          editar CA
        </button>
      );
    }

    it('recolhe a lista quando a barra de salvar aparece', async () => {
      const user = userEvent.setup();
      renderWithCharacter(
        <>
          <RestButtons />
          <EditAc />
        </>,
        monk(),
      );
      await user.click(screen.getByRole('button', { name: 'Short rest' }));
      const toggle = screen.getByRole('button', { name: /Short rest · / });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      await user.click(screen.getByRole('button', { name: 'editar CA' }));

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      // Still one tap from opening again
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    function Discard() {
      const { discard } = useCharacterActions();
      return (
        <button type="button" onClick={discard}>
          descartar
        </button>
      );
    }

    it('reabre a lista quando a barra de salvar some, se foi ela que recolheu', async () => {
      const user = userEvent.setup();
      renderWithCharacter(
        <>
          <RestButtons />
          <EditAc />
          <Discard />
        </>,
        monk(),
      );
      await user.click(screen.getByRole('button', { name: 'Short rest' }));
      const toggle = screen.getByRole('button', { name: /Short rest · / });

      await user.click(screen.getByRole('button', { name: 'editar CA' }));
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(screen.getByRole('button', { name: 'descartar' }));
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('não reabre a lista que o jogador recolheu', async () => {
      const user = userEvent.setup();
      renderWithCharacter(
        <>
          <RestButtons />
          <EditAc />
          <Discard />
        </>,
        monk(),
      );
      await user.click(screen.getByRole('button', { name: 'Short rest' }));
      const toggle = screen.getByRole('button', { name: /Short rest · / });
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(screen.getByRole('button', { name: 'editar CA' }));
      await user.click(screen.getByRole('button', { name: 'descartar' }));
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('com a barra já na tela, abre recolhida', async () => {
      const user = userEvent.setup();
      renderWithCharacter(
        <>
          <RestButtons />
          <EditAc />
        </>,
        monk(),
      );
      await user.click(screen.getByRole('button', { name: 'editar CA' }));
      await user.click(screen.getByRole('button', { name: 'Long rest' }));

      expect(screen.getByRole('button', { name: /Long rest · / })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  });

  it('só leitura não mostra os botões de descanso', () => {
    sheet.readOnly = true;
    renderWithCharacter(<RestButtons />, monk());
    expect(screen.queryByRole('button', { name: 'Short rest' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Long rest' })).toBeNull();
  });

  describe('Recuperar', () => {
    it('no longo, salva numa operação só o que volta sozinho e marca esses itens', async () => {
      const user = userEvent.setup();
      const { saveNow, sentNow } = renderWithCharacter(<RestButtons />, {
        ...monk(),
        hpCurrent: 3,
        hpMax: 30,
        resources: { 'class:monk:ki': { used: 4 } },
      });
      await user.click(screen.getByRole('button', { name: 'Long rest' }));

      await user.click(screen.getByRole('button', { name: 'Recover' }));

      expect(saveNow).toHaveBeenCalledTimes(1);
      expect(sentNow()).toMatchObject({
        hpCurrent: 30,
        hitDice: { total: '5d8', current: 5 },
        resources: { 'class:monk:ki': { used: 0 } },
      });
      expect(screen.getByRole('checkbox', { name: 'Full HP' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /Ki returns/ })).toBeChecked();
      expect(screen.getByRole('button', { name: 'Recover' })).toBeDisabled();
    });

    /**
     * Recovers, then resolves the Undo patch on the server copy as it is by then. Resolving the
     * Recover patch (as saveNow would) is what records what Undo puts back.
     */
    async function recoverAndUndo(
      character: DnD5eCharacter,
      afterRecover: (recovered: DnD5eCharacter) => DnD5eCharacter = (recovered) => recovered,
    ) {
      const user = userEvent.setup();
      const { saveNow } = renderWithCharacter(<RestButtons />, character);
      await user.click(screen.getByRole('button', { name: 'Long rest' }));
      await user.click(screen.getByRole('button', { name: 'Recover' }));
      const recovered = {
        ...character,
        ...resolvePatch(saveNow.mock.calls[0][0], character),
      } as DnD5eCharacter;

      const { action } = vi.mocked(toast.success).mock.calls[0][1] as unknown as {
        action: { onClick: () => Promise<void> };
      };
      await action.onClick();
      return resolvePatch(saveNow.mock.calls.at(-1)![0], afterRecover(recovered));
    }

    it('Desfazer devolve o que havia e desmarca', async () => {
      const undo = await recoverAndUndo({ ...monk(), hpCurrent: 3, hpMax: 30 });

      expect(undo).toMatchObject({ hpCurrent: 3, hitDice: { total: '5d8', current: 3 } });
      expect(await screen.findByRole('button', { name: 'Recover' })).toBeEnabled();
      expect(screen.getByRole('checkbox', { name: 'Full HP' })).not.toBeChecked();
    });

    it('Desfazer não desfaz o que mudou depois do Recuperar', async () => {
      // A hit taken after recovering is play: Undo leaves the HP as it is now
      const undo = await recoverAndUndo({ ...monk(), hpCurrent: 3, hpMax: 30 }, (recovered) => ({
        ...recovered,
        hpCurrent: 22,
      }));

      expect(undo).not.toHaveProperty('hpCurrent');
      expect(undo).toMatchObject({ hitDice: { total: '5d8', current: 3 } });
    });

    it('se falhar, não marca nada nem oferece Desfazer', async () => {
      const user = userEvent.setup();
      const { saveNow } = renderWithCharacter(<RestButtons />, monk());
      saveNow.mockRejectedValueOnce(new Error('offline'));
      await user.click(screen.getByRole('button', { name: 'Long rest' }));

      await user.click(screen.getByRole('button', { name: 'Recover' }));

      expect(toast.success).not.toHaveBeenCalled();
      expect(screen.getByRole('checkbox', { name: 'Full HP' })).not.toBeChecked();
      expect(screen.getByRole('button', { name: 'Recover' })).toBeEnabled();
    });
  });
});
