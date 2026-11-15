import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { SaveCharacterButton } from './SaveControls';
import { SheetPage } from './SheetPage';

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({
  useParams: () => params.value,
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1' };
const gearName = messages.characterAppearance.title;

function renderPage() {
  renderWithCharacter(
    <SheetPage tab="Status" actions={<SaveCharacterButton />}>
      content
    </SheetPage>,
    character,
  );
}

describe('SheetPage', () => {
  beforeEach(() => localStorage.clear());

  it('na ficha do dono, a engrenagem leva à aparência e vem logo antes de salvar', () => {
    params.value = { id: 'c1' };
    renderPage();

    const gear = screen.getByRole('link', { name: gearName });
    const save = screen.getByRole('button', { name: messages.common.saveChanges });

    expect(gear).toHaveAttribute('href', expect.stringMatching(/\/character\/c1\/appearance$/));
    expect(gear.compareDocumentPosition(save)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('quem só lê a ficha não vê a engrenagem', () => {
    params.value = { partyId: 'p1', id: 'c1' };
    renderPage();

    expect(screen.queryByRole('link', { name: gearName })).not.toBeInTheDocument();
  });

  it('destaca a engrenagem com a dica e clicar nela dispensa o destaque', async () => {
    params.value = { id: 'c1' };
    renderPage();
    const hint = messages.sheetSettings.hint;

    expect(await screen.findByText(hint)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('link', { name: gearName }));

    expect(screen.queryByText(hint)).not.toBeInTheDocument();
    expect(localStorage.getItem('rpgworld:hint:sheet-settings-177')).toBe('1');
  });

  it('o botão de dispensar esconde a dica', async () => {
    params.value = { id: 'c1' };
    renderPage();

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: messages.sheetSettings.dismiss }));

    expect(screen.queryByText(messages.sheetSettings.hint)).not.toBeInTheDocument();
  });

  it('quem só lê a ficha não vê a dica', () => {
    params.value = { partyId: 'p1', id: 'c1' };
    renderPage();

    expect(screen.queryByText(messages.sheetSettings.hint)).not.toBeInTheDocument();
  });
});
