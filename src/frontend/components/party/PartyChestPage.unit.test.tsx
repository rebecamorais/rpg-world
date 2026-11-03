import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { InventoryDto } from '@backend/contexts/characters/domain/repository/inventory.repo';
import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyChestPage } from './PartyChestPage';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock('@client', () => ({
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const hook = { party: null as PartyView | null, isLoading: false };
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => hook }));

const api = vi.mocked(rpgWorldApi);
const t = messages.parties.chest;
const gold = messages.characters.coins.gp.name;
const chest: InventoryDto = {
  containers: [
    {
      id: 'chest',
      kind: 'party_chest',
      name: null,
      position: 0,
      coins: { cp: 0, sp: 0, ep: 0, gp: 30, pp: 0 },
    },
  ],
  items: [],
};

describe('PartyChestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.party = { id: 'party-1', name: 'A Torre de Vidro', role: 'player' } as PartyView;
    api.get.mockImplementation(async (url: string) => (url.startsWith('/api/items') ? [] : chest));
  });

  it('mostra as moedas e o baú da party, lidos da rota do baú', async () => {
    renderWithProviders(<PartyChestPage partyId="party-1" />);

    expect(screen.getByRole('heading', { level: 1, name: 'A Torre de Vidro' })).toBeVisible();
    expect(screen.getByText(t.coinsTitle)).toBeVisible();
    expect(screen.getByText(t.itemsTitle)).toBeVisible();
    expect(await screen.findByText(t.empty)).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText(gold)).toHaveValue('30'));
    expect(api.get).toHaveBeenCalledWith('/api/parties/party-1/chest?locale=en');
  });

  it('o jogador muda as moedas do baú', async () => {
    renderWithProviders(<PartyChestPage partyId="party-1" />);
    await waitFor(() => expect(screen.getByLabelText(gold)).toHaveValue('30'));

    const input = screen.getByLabelText(gold);
    await userEvent.clear(input);
    await userEvent.type(input, '45');
    await userEvent.tab();

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/api/parties/party-1/chest/coins', {
        containerId: 'chest',
        coins: { cp: 0, sp: 0, ep: 0, gp: 45, pp: 0 },
      }),
    );
  });

  it('os diálogos de moedas e de itens abrem fora de uma ficha', async () => {
    renderWithProviders(<PartyChestPage partyId="party-1" />);
    const receive = screen.getByRole('button', { name: messages.characters.coins.receive });
    await waitFor(() => expect(receive).toBeEnabled());

    await userEvent.click(receive);
    expect(await screen.findByRole('dialog')).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: messages.characters.addItem }));
    expect(
      await screen.findByRole('dialog', { name: messages.characters.inventory.add.title }),
    ).toBeVisible();
  });

  it('mesa que a pessoa não vê: não encontrada', () => {
    hook.party = null;
    renderWithProviders(<PartyChestPage partyId="party-1" />);

    expect(screen.getByText(messages.parties.page.notFoundTitle)).toBeVisible();
    expect(within(document.body).queryByText(t.coinsTitle)).not.toBeInTheDocument();
  });
});
