import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CombatStatsSection from '../stats/CombatStatsSection';
import { LoreTab } from './LoreTab';
import { SaveBarSlotProvider } from './SaveControls';

vi.mock('next/navigation', () => ({
  useParams: () => ({}),
  usePathname: () => '/system/dnd5e/character/c1/lore',
  useRouter: () => ({ push: vi.fn() }),
}));

const updateLore = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('@frontend/hooks/useCharacterLore', () => ({
  useCharacterLore: () => ({
    lore: { age: '30' },
    isLoading: false,
    updateLore,
    isSaving: false,
  }),
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const character = {
  ...createDnD5eCharacter('owner', 'Bilbo', { ac: 14 }),
  id: 'c1',
} as DnD5eCharacter;

const t = messages.common;

/** The Lore tab on the sheet, with a card from the Status tab to leave the character draft edited. */
function renderLore() {
  return renderWithCharacter(
    <SaveBarSlotProvider>
      <LoreTab />
      <CombatStatsSection />
    </SaveBarSlotProvider>,
    character,
  );
}

async function editLore() {
  const age = screen.getByLabelText(messages.characters.loreFields.age);
  await userEvent.clear(age);
  await userEvent.type(age, '31');
}

async function editSheet() {
  await userEvent.clear(screen.getByLabelText('AC'));
  await userEvent.type(screen.getByLabelText('AC'), '15');
}

describe('LoreTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('salvar a lore diz "História salva.", não "Personagem salvo"', async () => {
    renderLore();
    await editLore();

    await userEvent.click(screen.getByRole('button', { name: t.save }));

    expect(updateLore).toHaveBeenCalledWith(expect.objectContaining({ age: '31' }));
    expect(toast.success).toHaveBeenCalledWith(messages.characters.loreSaved);
    expect(toast.success).not.toHaveBeenCalledWith(messages.characters.saveSuccess);
  });

  it('com a lore e a ficha editadas, uma barra só salva as duas ("Salvar tudo")', async () => {
    const { save } = renderLore();
    await editSheet();
    await editLore();

    expect(screen.getByText(t.unsavedLoreAndSheet)).toBeInTheDocument();
    expect(screen.queryByText(t.unsavedSheet)).not.toBeInTheDocument();
    expect(screen.queryByText(t.unsavedLore)).not.toBeInTheDocument();
    // The header's button and the bar's
    const saveAll = screen.getAllByRole('button', { name: t.saveAll });
    expect(saveAll).toHaveLength(2);

    await userEvent.click(saveAll[1]);

    expect(save).toHaveBeenCalledOnce();
    expect(updateLore).toHaveBeenCalledOnce();
  });

  it('só a ficha editada: a barra da Lore salva a ficha', async () => {
    const { save } = renderLore();
    await editSheet();

    expect(screen.getByText(t.unsavedSheet)).toBeInTheDocument();
    expect(screen.getAllByText(t.unsavedSheet)).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: t.save }));

    expect(save).toHaveBeenCalledOnce();
    expect(updateLore).not.toHaveBeenCalled();
  });
});
