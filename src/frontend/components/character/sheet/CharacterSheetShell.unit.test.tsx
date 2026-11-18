import { screen } from '@testing-library/react';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { CharacterSheetShell } from './CharacterSheetShell';

const PATH = '/parties/p1/characters/c1';

vi.mock('next/navigation', () => ({
  useParams: () => ({ partyId: 'p1' }),
  usePathname: () => PATH,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@frontend/context/UserContext', () => ({
  useCurrentUser: () => ({ currentUser: { id: 'gm' } }),
}));

const character = { ...createDnD5eCharacter('player', 'Arani'), id: 'c1' } as DnD5eCharacter;

describe('CharacterSheetShell', () => {
  it('na ficha da mesa, "Voltar para a mesa" é um botão, e a ficha diz que é só leitura', () => {
    renderWithCharacter(
      <CharacterSheetShell>
        <p>sheet</p>
      </CharacterSheetShell>,
      character,
    );
    const t = messages.parties.sheet;

    const back = screen.getByRole('link', { name: t.back });
    expect(back).toHaveAttribute('href', '/parties/p1');
    // The Button's look (border, height), not an underlined link in the text
    expect(back).not.toHaveClass('underline');
    expect(back.className).toMatch(/\bborder\b/);
    expect(screen.getByText(t.readOnly)).toBeInTheDocument();
  });

  // Inside the sheet's `isolate`, the bars' z-40 only counted there: the footer's "Copy Pix key"
  // was painted over Discard and Save, and clicking Save copied the key
  it('as barras de salvar ficam fora do isolate da ficha, com a cor do personagem', () => {
    const { container } = renderWithCharacter(
      <CharacterSheetShell>
        <p>sheet</p>
      </CharacterSheetShell>,
      character,
    );

    const slot = container.querySelector('[data-save-bar-slot]');
    expect(slot).not.toBeNull();
    expect(slot!.closest('.isolate')).toBeNull();
    expect(slot).toHaveClass('character-context');
    expect(container.querySelector('.isolate')).toContainElement(screen.getByText('sheet'));
  });
});
