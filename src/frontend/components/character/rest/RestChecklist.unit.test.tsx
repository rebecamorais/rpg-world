import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildResourceBoxes } from '@shared/systems/dnd5e/class-resources';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { MONK } from '../resources/fixtures';
import { RestButtons } from './RestButtons';

const sheet = vi.hoisted(() => ({ readOnly: false }));

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }));
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
        isLoading: false,
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

  it('só leitura não mostra os botões de descanso', () => {
    sheet.readOnly = true;
    renderWithCharacter(<RestButtons />, monk());
    expect(screen.queryByRole('button', { name: 'Short rest' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Long rest' })).toBeNull();
  });
});
