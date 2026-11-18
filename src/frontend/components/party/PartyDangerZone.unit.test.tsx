import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyDangerZone } from './PartyDangerZone';

const hook = { remove: { mutateAsync: vi.fn(), isPending: false } };
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => hook }));
const coins = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
const emptyChest = () => ({ containers: [{ kind: 'party_chest', coins }], items: [] });
const lost = vi.hoisted(() => ({
  chest: undefined as unknown,
  encounter: null as unknown,
}));
vi.mock('@frontend/hooks/useInventory', () => ({
  usePartyChest: () => ({ inventory: lost.chest }),
}));
vi.mock('@frontend/hooks/useEncounter', () => ({
  useEncounter: () => ({ encounter: lost.encounter }),
}));

const t = messages.parties.manage;
const party = { id: 'party-1', name: 'A Torre' } as PartyView;
const deleteTitle = t.deleteTitle.replace('{name}', 'A Torre');

describe('PartyDangerZone', () => {
  beforeEach(() => {
    hook.remove.mutateAsync.mockReset().mockResolvedValue(undefined);
    lost.chest = emptyChest();
    lost.encounter = null;
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

// mesas 24 / decision of 2026-11-18: the name in the title; typing it only with something to lose
describe('PartyDangerZone: apagar com o nome', () => {
  beforeEach(() => {
    hook.remove.mutateAsync.mockReset().mockResolvedValue(undefined);
    lost.chest = emptyChest();
    lost.encounter = null;
  });

  async function openDelete() {
    renderWithProviders(<PartyDangerZone party={party} onDeleted={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: t.deleteParty }));
    const dialog = screen.getByRole('alertdialog', { name: deleteTitle });
    const confirm = within(dialog).getByRole('button', { name: t.deleteParty });
    return { user, dialog, confirm };
  }

  it('mesa vazia e sem combate: o título tem o nome, e apaga com um clique', async () => {
    const { dialog, confirm } = await openDelete();

    expect(
      within(dialog).queryByRole('textbox', { name: messages.common.typeToConfirmLabel }),
    ).not.toBeInTheDocument();
    expect(confirm).toBeEnabled();
  });

  it.each([
    ['um item no baú', () => (lost.chest = { ...emptyChest(), items: [{ id: 'i1' }] })],
    [
      'moedas no baú',
      () =>
        (lost.chest = {
          containers: [{ kind: 'party_chest', coins: { ...coins, gp: 3 } }],
          items: [],
        }),
    ],
    ['um combate', () => (lost.encounter = { role: 'gm' })],
  ])('com %s, só apaga depois de digitar o nome', async (_, arrange) => {
    arrange();
    const { user, dialog, confirm } = await openDelete();

    expect(confirm).toBeDisabled();
    const field = within(dialog).getByRole('textbox', {
      name: messages.common.typeToConfirmLabel,
    });
    await user.type(field, 'A Tor');
    expect(confirm).toBeDisabled();
    await user.type(field, 're ');
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(hook.remove.mutateAsync).toHaveBeenCalledOnce();
  });
});
