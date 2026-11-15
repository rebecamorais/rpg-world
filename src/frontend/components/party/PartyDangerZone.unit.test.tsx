import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyDangerZone } from './PartyDangerZone';

const hook = { remove: { mutateAsync: vi.fn(), isPending: false } };
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => hook }));

const t = messages.parties.manage;
const party = { id: 'party-1' } as PartyView;

describe('PartyDangerZone', () => {
  beforeEach(() => {
    hook.remove.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('o botão é vermelho e fica numa região própria de zona de perigo', () => {
    renderWithProviders(<PartyDangerZone party={party} onDeleted={vi.fn()} />);

    expect(screen.getByRole('region', { name: t.dangerZone })).toBeVisible();
    expect(screen.getByRole('button', { name: t.deleteParty })).toHaveClass('bg-destructive');
  });

  it('cancelar a confirmação não apaga nada', async () => {
    const onDeleted = vi.fn();
    renderWithProviders(<PartyDangerZone party={party} onDeleted={onDeleted} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: t.deleteParty }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(t.deleteConfirm);
    await user.click(within(dialog).getByRole('button', { name: messages.common.cancel }));

    expect(hook.remove.mutateAsync).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('só apaga depois de confirmar no diálogo vermelho', async () => {
    const onDeleted = vi.fn();
    renderWithProviders(<PartyDangerZone party={party} onDeleted={onDeleted} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: t.deleteParty }));
    const confirm = within(screen.getByRole('alertdialog')).getByRole('button', {
      name: t.deleteParty,
    });
    expect(confirm).toHaveClass('bg-destructive');
    await user.click(confirm);

    expect(hook.remove.mutateAsync).toHaveBeenCalledOnce();
    expect(onDeleted).toHaveBeenCalledOnce();
  });
});
