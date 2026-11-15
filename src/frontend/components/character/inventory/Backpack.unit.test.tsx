import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';
import { PartyChest } from '@frontend/components/party/PartyChestPage';
import { INVENTORY_VIEW_KEYS } from '@frontend/hooks/useInventoryView';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { Backpack } from './Backpack';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), dismiss: vi.fn() }),
}));
vi.mock('@client', () => ({
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({ useParams: () => params.value }));

const api = vi.mocked(rpgWorldApi);
const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1' } as DnD5eCharacter;

const item = (over: Partial<ItemDto> & Pick<ItemDto, 'id' | 'name'>): ItemDto => ({
  key: `dnd5e:srd-5.2:item:${over.id}`,
  edition: '2024',
  category: 'gear',
  description: null,
  value: null,
  weight: null,
  strength: null,
  stealthDisadvantage: false,
  ac: null,
  damage: null,
  versatile: null,
  properties: [],
  range: null,
  untranslated: false,
  ...over,
});

const ROPE = item({ id: 'rope-hempen', name: 'Corda de Cânhamo', value: 100, weight: 10 });
const TORCH = item({ id: 'torch', name: 'Torch', value: 1, weight: 1 });
const OLD_ROPE = item({
  id: 'rope-hempen',
  name: 'Corda de Cânhamo',
  key: 'dnd5e:srd-5.1:item:rope-hempen',
  edition: '2014',
});
const CATALOG = [
  ROPE,
  TORCH,
  OLD_ROPE,
  item({ id: 'longsword', name: 'Longsword', category: 'weapon', value: 1500, weight: 3 }),
];

const entry = (id: string, ref: ItemDto | string, quantity = 1) => ({
  id,
  containerId: 'bag1',
  ref: typeof ref === 'string' ? ref : ref.key,
  quantity,
  item: typeof ref === 'string' ? null : ref,
});

const inventory = (items: ReturnType<typeof entry>[]) => ({
  containers: [
    { id: 'pouch1', kind: 'coin_pouch', name: null, position: 0, coins: {} },
    { id: 'bag1', kind: 'backpack', name: null, position: 1, coins: {} },
  ],
  items,
});

/** The API's answers: the item catalog, the conditions (item rules link them) and the inventory. */
const serve = (items: ReturnType<typeof entry>[]) => async (url: string) =>
  url.startsWith('/api/items')
    ? CATALOG
    : url.startsWith('/api/conditions')
      ? []
      : inventory(items);

function renderBackpack(items: ReturnType<typeof entry>[], readOnly = false) {
  api.get.mockImplementation(serve(items));
  return renderWithCharacter(
    readOnly ? (
      <SheetFieldset>
        <Backpack />
      </SheetFieldset>
    ) : (
      <Backpack />
    ),
    character,
  );
}

describe('Backpack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.value = {};
    localStorage.clear();
    api.patch.mockResolvedValue(undefined);
    api.delete.mockResolvedValue(undefined);
    api.post.mockResolvedValue(entry('new', ROPE));
  });

  it('enquanto carrega, mostra o esqueleto e não o estado vazio', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderWithCharacter(<Backpack />, character);

    expect(await screen.findByRole('status')).toHaveTextContent('Loading items');
    expect(screen.queryByText('The backpack is empty.')).not.toBeInTheDocument();
  });

  it('vazia, mostra o estado vazio com "Add item"', async () => {
    renderBackpack([]);

    expect(await screen.findByText('The backpack is empty.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Add item' })).toBeEnabled();
  });

  it('lista nome, quantidade, peso e preço, e soma o peso total', async () => {
    renderBackpack([entry('e1', ROPE, 2), entry('e2', TORCH, 5)]);

    expect(await screen.findByText('Corda de Cânhamo')).toBeInTheDocument();
    // An <output> (role status): the name is read, and a new quantity is announced
    expect(screen.getByRole('status', { name: 'Quantity of Corda de Cânhamo' })).toHaveTextContent(
      '2',
    );
    expect(screen.getByText('10 lb')).toBeInTheDocument();
    expect(screen.getByText('1 GP')).toBeInTheDocument();
    // 10 x 2 + 1 x 5
    expect(screen.getByText('Total weight: 25 lb')).toBeInTheDocument();
  });

  it('peso total com uma casa decimal', async () => {
    renderBackpack([entry('e1', item({ id: 'x', name: 'Feather', weight: 0.25 }), 3)]);

    expect(await screen.findByText('Total weight: 0.8 lb')).toBeInTheDocument();
  });

  it('só mostra o que está na mochila', async () => {
    renderBackpack([entry('e1', ROPE), { ...entry('e2', TORCH), containerId: 'chest1' }]);

    expect(await screen.findByText('Corda de Cânhamo')).toBeInTheDocument();
    expect(screen.queryByText('Torch')).not.toBeInTheDocument();
  });

  it('− na quantidade 1 não vai a 0; + manda a diferença', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', ROPE, 1)]);

    // At 1 the − stops; removing is its own button
    expect(await screen.findByRole('button', { name: 'One less Corda de Cânhamo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove Corda de Cânhamo' })).toBeEnabled();
    api.get.mockImplementation(serve([entry('e1', ROPE, 2)]));
    await user.click(screen.getByRole('button', { name: 'One more Corda de Cânhamo' }));

    // +1, not "2": two tabs adding at once both count
    expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/items/e1', {
      delta: 1,
      key: expect.any(String),
    });
    expect(screen.getByLabelText('Quantity of Corda de Cânhamo')).toHaveTextContent('2');
  });

  it('a lixeira remove, avisa e Undo devolve', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', ROPE, 1)]);

    await user.click(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' }));

    expect(api.delete).toHaveBeenCalledWith('/api/characters/c1/inventory/items/e1');
    await waitFor(() => expect(toast).toHaveBeenCalled());
    const [message, options] = vi.mocked(toast).mock.calls[0] as unknown as [
      string,
      { action: { label: string; onClick: () => void } },
    ];
    expect(message).toBe('Corda de Cânhamo removed');
    expect(options.action.label).toBe('Undo');

    options.action.onClick();
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/api/characters/c1/inventory/items?locale=en', {
        ref: ROPE.key,
        containerId: 'bag1',
        quantity: 1,
        key: expect.any(String),
      }),
    );
  });

  it('remover pela lixeira leva o foco ao item seguinte, não ao topo da página', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', ROPE, 1), entry('e2', TORCH, 1)]);
    api.get.mockImplementation(serve([entry('e2', TORCH, 1)]));

    await user.click(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Details for Torch' })).toHaveFocus(),
    );
  });

  it('remover o último item leva o foco a "Add item"', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', ROPE, 1)]);
    api.get.mockImplementation(serve([]));

    await user.click(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add item' })).toHaveFocus());
  });

  it('item que saiu do catálogo mostra a ref e deixa remover (Ponto 2)', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', 'dnd5e:srd-5.2:item:gone')]);

    expect(await screen.findByText('dnd5e:srd-5.2:item:gone')).toBeInTheDocument();
    const other = screen.getByRole('region', { name: 'Other' });
    await user.click(within(other).getByRole('button', { name: 'Remove dnd5e:srd-5.2:item:gone' }));

    expect(api.delete).toHaveBeenCalledWith('/api/characters/c1/inventory/items/e1');
  });

  it('mestre (somente leitura): nenhum botão funciona', async () => {
    params.value = { partyId: 'p1' };
    renderBackpack([entry('e1', ROPE, 2)], true);

    expect(await screen.findByLabelText('Quantity of Corda de Cânhamo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'One more Corda de Cânhamo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeDisabled();
  });

  it('mestre (somente leitura): ainda abre os detalhes, mas + − e remover ficam desativados', async () => {
    params.value = { partyId: 'p1' };
    renderBackpack(
      [entry('e1', item({ id: 'x', name: 'Rope', description: 'Strong rope.', weight: 10 }), 2)],
      true,
    );

    // fireEvent: user-event treats everything in a disabled fieldset as disabled, a browser does not
    fireEvent.click(await screen.findByRole('button', { name: 'Details for Rope' }));

    expect(screen.getByText('Strong rope.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'One less Rope' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'One more Rope' })).toBeDisabled();
  });

  it('agrupa por tipo com peso do grupo', async () => {
    renderBackpack([
      entry('e1', item({ id: 'dagger', name: 'Dagger', category: 'weapon', weight: 1 }), 2),
      entry('e2', ROPE),
    ]);

    const weapons = await screen.findByRole('region', { name: 'Weapons' });
    expect(within(weapons).getByRole('heading', { name: 'Weapons' })).toHaveClass(
      'text-item-flare',
    );
    expect(within(weapons).getByText('Dagger')).toBeInTheDocument();
    expect(within(weapons).getByText('2 lb')).toBeInTheDocument();
    const gear = screen.getByRole('region', { name: 'Gear' });
    expect(within(gear).getByText('Corda de Cânhamo')).toBeInTheDocument();
    expect(within(gear).getAllByText('10 lb').length).toBeGreaterThan(0);
  });

  it('a lixeira fica na linha com qualquer quantidade, e só uma', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', ROPE, 3)]);

    await user.click(await screen.findByRole('button', { name: 'Details for Corda de Cânhamo' }));

    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'One less Corda de Cânhamo' })).toBeEnabled();
  });

  describe('a linha removida segura o lugar', () => {
    /** The options of the last toast. */
    const lastToast = () =>
      vi.mocked(toast).mock.calls.at(-1) as unknown as [
        string,
        {
          id: string;
          action: { label: string; onClick: () => void };
          onAutoClose: () => void;
        },
      ];

    it('a linha fica no lugar, sem controles, até o toast fechar', async () => {
      const user = userEvent.setup();
      renderBackpack([entry('e1', ROPE, 1), entry('e2', TORCH, 1)]);
      api.get.mockImplementation(serve([entry('e2', TORCH, 1)]));

      await user.click(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' }));

      const gear = screen.getByRole('region', { name: 'Gear' });
      const rows = within(gear).getAllByRole('listitem');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent('Corda de Cânhamo');
      expect(within(rows[0]).getByRole('button', { name: 'Undo removing Corda de Cânhamo' }));
      // Where the trash was there is nothing to tap
      expect(within(rows[0]).queryByRole('button', { name: /^Remove / })).toBeNull();
      // The placeholder weighs nothing
      expect(screen.getByText('Total weight: 1 lb')).toBeInTheDocument();

      act(() => lastToast()[1].onAutoClose());
      await waitFor(() => expect(within(gear).getAllByRole('listitem')).toHaveLength(1));
    });

    it('remover o último item deixa a linha (e o Desfazer) até o toast fechar', async () => {
      const user = userEvent.setup();
      renderBackpack([entry('e1', ROPE, 1)]);
      api.get.mockImplementation(serve([]));

      await user.click(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' }));
      await waitFor(() => expect(api.delete).toHaveBeenCalled());

      // Before: the empty state came at once and took the placeholder with it
      expect(screen.queryByText('The backpack is empty.')).toBeNull();
      expect(screen.getByRole('button', { name: 'Undo removing Corda de Cânhamo' })).toBeVisible();
      // The header still has the view switch and "Add item"
      expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();

      act(() => lastToast()[1].onAutoClose());
      expect(await screen.findByText('The backpack is empty.')).toBeInTheDocument();
    });

    it('remoção recusada: o item volta e o Desfazer não o duplica', async () => {
      const user = userEvent.setup();
      renderBackpack([entry('e1', ROPE, 1), entry('e2', TORCH, 1)]);
      let refuse!: (error: Error) => void;
      api.delete.mockImplementation(
        (url: string) =>
          new Promise((resolve, reject) =>
            url.endsWith('/e2') ? (refuse = reject) : resolve(undefined),
          ),
      );
      // What the server has: the rope left, the torch didn't
      api.get.mockImplementation(serve([entry('e2', TORCH, 1)]));

      await user.click(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' }));
      await user.click(screen.getByRole('button', { name: 'Remove Torch' }));
      expect(lastToast()[0]).toBe('2 items removed');
      await waitFor(() => expect(api.delete).toHaveBeenCalledTimes(2));

      // The torch's DELETE fails: it is back in the list, and the toast only counts the rope
      await act(async () => refuse(new Error('boom')));
      await waitFor(() => expect(lastToast()[0]).toBe('Corda de Cânhamo removed'));
      expect(screen.getByRole('button', { name: 'Remove Torch' })).toBeVisible();

      lastToast()[1].action.onClick();
      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
      expect(api.post).toHaveBeenCalledWith('/api/characters/c1/inventory/items?locale=en', {
        ref: ROPE.key,
        containerId: 'bag1',
        quantity: 1,
        key: expect.any(String),
      });
    });

    it('o Desfazer da própria linha devolve o item e fecha o toast', async () => {
      const user = userEvent.setup();
      renderBackpack([entry('e1', ROPE, 2), entry('e2', TORCH, 1)]);
      api.get.mockImplementation(serve([entry('e2', TORCH, 1)]));

      await user.click(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' }));
      await user.click(screen.getByRole('button', { name: 'Undo removing Corda de Cânhamo' }));

      expect(api.post).toHaveBeenCalledWith('/api/characters/c1/inventory/items?locale=en', {
        ref: ROPE.key,
        containerId: 'bag1',
        quantity: 2,
        key: expect.any(String),
      });
      expect(toast.dismiss).toHaveBeenCalledWith(lastToast()[1].id);
    });

    it('duas remoções seguidas viram um toast só, cujo Undo devolve as duas', async () => {
      const user = userEvent.setup();
      renderBackpack([entry('e1', ROPE, 1), entry('e2', TORCH, 3), entry('e3', ROPE, 1)]);

      await user.click(await screen.findByRole('button', { name: 'Remove Torch' }));
      const [first, { id }] = lastToast();
      expect(first).toBe('Torch removed');
      await user.click(screen.getAllByRole('button', { name: 'Remove Corda de Cânhamo' })[0]);

      const [second, options] = lastToast();
      expect(second).toBe('2 items removed');
      // Same id: the toast is updated, not stacked over the first one's Undo
      expect(options.id).toBe(id);

      options.action.onClick();
      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
      expect(
        api.post.mock.calls.map(([, body]) => (body as { quantity: number }).quantity),
      ).toEqual([3, 1]);
    });
  });

  it('mestre (somente leitura): a lixeira (quantidade 1) fica desativada', async () => {
    params.value = { partyId: 'p1' };
    renderBackpack([entry('e1', ROPE, 1)], true);

    expect(await screen.findByRole('button', { name: 'Remove Corda de Cânhamo' })).toBeDisabled();
  });

  describe('grade', () => {
    const RICH_ROPE = item({ id: 'rope', name: 'Rope', description: 'Strong rope.', weight: 10 });

    async function toGrid() {
      fireEvent.click(await screen.findByRole('radio', { name: 'Grid' }));
    }

    it('começa na lista e lembra a grade', async () => {
      renderBackpack([entry('e1', RICH_ROPE, 2)]);

      expect(await screen.findByRole('radio', { name: 'List' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Rope, 2' })).toBeNull();

      await toGrid();

      expect(screen.getByRole('button', { name: 'Rope, 2' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
      expect(localStorage.getItem(INVENTORY_VIEW_KEYS.backpack)).toBe('grid');
    });

    it('setas trocam a visualização', async () => {
      renderBackpack([entry('e1', RICH_ROPE, 2)]);

      fireEvent.keyDown(await screen.findByRole('radio', { name: 'List' }), { key: 'ArrowRight' });
      expect(screen.getByRole('button', { name: 'Rope, 2' })).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole('radio', { name: 'Grid' }), { key: 'ArrowLeft' });
      expect(screen.queryByRole('button', { name: 'Rope, 2' })).toBeNull();
    });

    it('baú usa outra chave', async () => {
      localStorage.setItem(INVENTORY_VIEW_KEYS.backpack, 'grid');
      api.get.mockImplementation(serve([entry('e1', RICH_ROPE, 2)]));
      renderWithProviders(<PartyChest partyId="p1" />);

      expect(await screen.findByRole('radio', { name: 'List' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.queryByRole('button', { name: 'Rope, 2' })).toBeNull();
    });

    it('grade: selecionar abre o painel com stepper e detalhes', async () => {
      renderBackpack([entry('e1', RICH_ROPE, 2)]);
      await toGrid();

      const tile = screen.getByRole('button', { name: 'Rope, 2' });
      expect(tile).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByText('Strong rope.')).toBeNull();
      fireEvent.click(tile);

      expect(tile).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('region', { name: 'Rope' })).toHaveAttribute(
        'id',
        tile.getAttribute('aria-controls'),
      );
      expect(screen.getByRole('status', { name: 'Quantity of Rope' })).toHaveTextContent('2');
      expect(screen.getByText('Strong rope.')).toBeInTheDocument();

      fireEvent.keyDown(tile, { key: 'Enter' });
      expect(tile).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByText('Strong rope.')).toBeNull();
    });

    it('grade: remover o selecionado deixa o painel no lugar, riscado, com o próprio Desfazer', async () => {
      renderBackpack([entry('e1', RICH_ROPE, 1)]);
      await toGrid();
      fireEvent.click(screen.getByRole('button', { name: 'Rope, 1' }));
      expect(screen.getByText('Strong rope.')).toBeInTheDocument();

      api.get.mockImplementation(serve([]));
      fireEvent.click(screen.getByRole('button', { name: 'Remove Rope' }));

      await waitFor(() =>
        expect(api.delete).toHaveBeenCalledWith('/api/characters/c1/inventory/items/e1'),
      );
      // Before: the panel unmounted and what was under it moved up under the finger
      const panel = await screen.findByRole('region', { name: 'Rope' });
      await waitFor(() =>
        expect(within(panel).getByRole('button', { name: 'Undo removing Rope' })).toBeVisible(),
      );
      expect(within(panel).getByText('Strong rope.')).toBeInTheDocument();
      // Where the trash and the stepper were there is nothing to tap
      expect(within(panel).queryByRole('button', { name: 'Remove Rope' })).toBeNull();
      expect(within(panel).queryByRole('status', { name: 'Quantity of Rope' })).toBeNull();

      fireEvent.click(within(panel).getByRole('button', { name: 'Undo removing Rope' }));
      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/api/characters/c1/inventory/items?locale=en', {
          ref: RICH_ROPE.key,
          containerId: 'bag1',
          quantity: 1,
          key: expect.any(String),
        }),
      );
    });

    it('grade: o painel do removido fecha quando o toast fecha', async () => {
      renderBackpack([entry('e1', RICH_ROPE, 1), entry('e2', TORCH, 1)]);
      await toGrid();
      fireEvent.click(screen.getByRole('button', { name: 'Rope, 1' }));
      api.get.mockImplementation(serve([entry('e2', TORCH, 1)]));
      fireEvent.click(screen.getByRole('button', { name: 'Remove Rope' }));
      await waitFor(() => expect(toast).toHaveBeenCalled());

      const [, options] = vi.mocked(toast).mock.calls.at(-1) as unknown as [
        string,
        { onAutoClose: () => void },
      ];
      act(() => options.onAutoClose());

      await waitFor(() => expect(screen.queryByRole('region', { name: 'Rope' })).toBeNull());
      expect(api.post).not.toHaveBeenCalled();
    });

    it('grade: o selo ×N só aparece com mais de um', async () => {
      renderBackpack([entry('e1', RICH_ROPE, 2), entry('e2', TORCH, 1)]);
      await toGrid();

      expect(screen.getByRole('button', { name: 'Rope, 2' })).toHaveTextContent('×2');
      expect(screen.getByRole('button', { name: 'Torch, 1' })).not.toHaveTextContent('×');
    });

    it('grade: remover o selecionado leva o foco ao quadrado seguinte', async () => {
      renderBackpack([entry('e1', RICH_ROPE, 1), entry('e2', TORCH, 1)]);
      await toGrid();
      fireEvent.click(screen.getByRole('button', { name: 'Rope, 1' }));
      api.get.mockImplementation(serve([entry('e2', TORCH, 1)]));

      fireEvent.click(screen.getByRole('button', { name: 'Remove Rope' }));

      await waitFor(() => expect(screen.getByRole('button', { name: 'Torch, 1' })).toHaveFocus());
    });

    it('grade: item fora do catálogo', async () => {
      renderBackpack([entry('e1', 'dnd5e:srd-5.2:item:gone')]);
      await toGrid();

      fireEvent.click(screen.getByRole('button', { name: 'dnd5e:srd-5.2:item:gone, 1' }));

      expect(
        screen.getByText('This item is no longer in the catalog. You can remove it.'),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Remove dnd5e:srd-5.2:item:gone' }));
      await waitFor(() =>
        expect(api.delete).toHaveBeenCalledWith('/api/characters/c1/inventory/items/e1'),
      );
    });

    it('mestre na grade', async () => {
      params.value = { partyId: 'p1' };
      renderBackpack([entry('e1', RICH_ROPE, 2), entry('e2', TORCH, 1)], true);

      // fireEvent: user-event treats everything in a disabled fieldset as disabled, a browser does not
      await toGrid();
      fireEvent.click(screen.getByRole('button', { name: 'Rope, 2' }));

      expect(screen.getByText('Strong rope.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'One less Rope' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'One more Rope' })).toBeDisabled();
      expect(screen.getAllByRole('button', { name: 'Add item' })).not.toHaveLength(0);
      for (const add of screen.getAllByRole('button', { name: 'Add item' })) {
        expect(add).toBeDisabled();
      }

      fireEvent.click(screen.getByRole('button', { name: 'Torch, 1' }));
      expect(screen.getByRole('button', { name: 'Remove Torch' })).toBeDisabled();
    });
  });

  describe('AddItemDialog', () => {
    async function openDialog(items: ReturnType<typeof entry>[] = []) {
      const user = userEvent.setup();
      renderBackpack(items);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add item' })).toBeEnabled());
      await user.click(screen.getByRole('button', { name: 'Add item' }));
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findAllByRole('button', { name: /^Add / });
      return { user, dialog };
    }

    it('busca sem acento acha "Cânhamo" por "canhamo" e por "hempen"', async () => {
      const { user, dialog } = await openDialog();
      const search = within(dialog).getByLabelText('Search items');

      await user.type(search, 'canhamo');
      expect(within(dialog).getByRole('button', { name: 'Add Corda de Cânhamo' })).toBeVisible();
      expect(within(dialog).queryByRole('button', { name: 'Add Torch' })).not.toBeInTheDocument();

      await user.clear(search);
      await user.type(search, 'hempen');
      expect(within(dialog).getByRole('button', { name: 'Add Corda de Cânhamo' })).toBeVisible();
      expect(within(dialog).queryByRole('button', { name: 'Add Torch' })).not.toBeInTheDocument();
    });

    it('avisa quando passa de 100 itens para refinar a busca', async () => {
      const many = Array.from({ length: 101 }, (_, i) =>
        item({ id: `bulk-${i}`, name: `Bulk ${i}` }),
      );
      CATALOG.push(...many);
      try {
        await openDialog();
        expect(screen.getByText(/Showing the first 100/)).toBeInTheDocument();
      } finally {
        CATALOG.length -= many.length;
      }
    });

    it('filtra por categoria', async () => {
      const { user, dialog } = await openDialog();

      await user.click(within(dialog).getByRole('combobox', { name: 'Category' }));
      await user.click(await screen.findByRole('option', { name: 'Weapons' }));

      const longsword = within(dialog).getByRole('button', { name: 'Add Longsword' });
      expect(longsword).toBeVisible();
      expect(within(dialog).queryByRole('button', { name: 'Add Torch' })).not.toBeInTheDocument();
      // The row: name, category (singular), price and weight
      expect(longsword).toHaveTextContent('Weapon');
      expect(longsword).not.toHaveTextContent('Weapons');
      expect(longsword).toHaveTextContent('15 GP');
      expect(longsword).toHaveTextContent('3 lb');
    });

    it('com a mochila vazia a edição começa em 2024', async () => {
      const { dialog } = await openDialog();

      expect(within(dialog).getByRole('combobox', { name: 'Edition' })).toHaveTextContent('2024');
      expect(within(dialog).getAllByRole('button', { name: 'Add Corda de Cânhamo' })).toHaveLength(
        1,
      );
    });

    it('começa na edição que mais aparece na mochila', async () => {
      const { dialog } = await openDialog([
        entry('e1', OLD_ROPE),
        entry('e2', item({ ...OLD_ROPE, id: 'x', name: 'Old X', key: 'dnd5e:srd-5.1:item:x' })),
        entry('e3', TORCH),
      ]);

      expect(within(dialog).getByRole('combobox', { name: 'Edition' })).toHaveTextContent('2014');
      expect(within(dialog).queryByRole('button', { name: 'Add Torch' })).not.toBeInTheDocument();
    });

    it('escolher chama addItem(key) e fecha', async () => {
      const { user, dialog } = await openDialog();

      await user.click(within(dialog).getByRole('button', { name: 'Add Torch' }));

      expect(api.post).toHaveBeenCalledWith('/api/characters/c1/inventory/items?locale=en', {
        ref: TORCH.key,
        containerId: 'bag1',
        quantity: 1,
        key: expect.any(String),
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
});
