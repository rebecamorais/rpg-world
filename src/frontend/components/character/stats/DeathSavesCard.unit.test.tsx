import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { DeathSavesCard } from './DeathSavesCard';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderCard(deathSaves = { successes: 1, failures: 2 }) {
  const character = { ...createDnD5eCharacter('o', 'x'), id: 'c1', deathSaves } as DnD5eCharacter;
  return renderWithCharacter(<DeathSavesCard />, character);
}

describe('DeathSavesCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marcar um teste salva na hora, sem passar pelo rascunho', async () => {
    const { sentNow, isDirty } = renderCard();

    await userEvent.click(screen.getByRole('button', { name: 'Death save success 2' }));

    expect(sentNow()).toEqual({ deathSaves: { successes: 2, failures: 2 } });
    expect(isDirty()).toBe(false);
  });

  it('o ícone de zerar salva na hora e oferece Desfazer, que volta as marcas', async () => {
    const { saveNow, sentNow } = renderCard();

    await userEvent.click(screen.getByRole('button', { name: 'Reset death saves' }));

    expect(sentNow()).toEqual({ deathSaves: { successes: 0, failures: 0 } });
    expect(toast.success).toHaveBeenCalledWith('Death saves cleared', expect.anything());
    const { action } = vi.mocked(toast.success).mock.calls[0][1] as unknown as {
      action: { onClick: () => void };
    };
    action.onClick();
    expect(saveNow).toHaveBeenLastCalledWith({ deathSaves: { successes: 1, failures: 2 } });
  });

  it('se zerar falhar, não oferece Desfazer', async () => {
    const { saveNow } = renderCard();
    saveNow.mockRejectedValueOnce(new Error('offline'));

    await userEvent.click(screen.getByRole('button', { name: 'Reset death saves' }));

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('sem nada marcado, zerar fica desabilitado', () => {
    renderCard({ successes: 0, failures: 0 });

    expect(screen.getByRole('button', { name: 'Reset death saves' })).toBeDisabled();
  });
});
