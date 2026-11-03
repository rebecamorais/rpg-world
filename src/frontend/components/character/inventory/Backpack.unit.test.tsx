import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { Backpack } from './Backpack';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
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

function renderBackpack(items: ReturnType<typeof entry>[], readOnly = false) {
  api.get.mockImplementation(async (url: string) =>
    url.startsWith('/api/items') ? CATALOG : inventory(items),
  );
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
    api.patch.mockResolvedValue(undefined);
    api.delete.mockResolvedValue(undefined);
    api.post.mockResolvedValue(entry('new', ROPE));
  });

  it('vazia, mostra o estado vazio com "Add Item"', async () => {
    renderBackpack([]);

    expect(await screen.findByText('The backpack is empty.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Add Item' })).toBeEnabled();
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

  it('− na quantidade 1 não vai a 0; + manda o valor absoluto', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', ROPE, 1)]);

    expect(await screen.findByRole('button', { name: 'One less Corda de Cânhamo' })).toBeDisabled();
    api.get.mockImplementation(async (url: string) =>
      url.startsWith('/api/items') ? CATALOG : inventory([entry('e1', ROPE, 2)]),
    );
    await user.click(screen.getByRole('button', { name: 'One more Corda de Cânhamo' }));

    expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/items/e1', {
      quantity: 2,
    });
    expect(screen.getByLabelText('Quantity of Corda de Cânhamo')).toHaveTextContent('2');
  });

  it('remover fica nos detalhes e o aviso "Undo" devolve o item', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', ROPE, 3)]);

    await user.click(await screen.findByRole('button', { name: 'Details for Corda de Cânhamo' }));
    await user.click(screen.getByRole('button', { name: 'Remove Corda de Cânhamo' }));

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
        quantity: 3,
      }),
    );
  });

  it('item que saiu do catálogo mostra a ref e deixa remover (Ponto 2)', async () => {
    const user = userEvent.setup();
    renderBackpack([entry('e1', 'dnd5e:srd-5.2:item:gone')]);

    expect(await screen.findByText('dnd5e:srd-5.2:item:gone')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove dnd5e:srd-5.2:item:gone' }));

    expect(api.delete).toHaveBeenCalledWith('/api/characters/c1/inventory/items/e1');
  });

  it('mestre (somente leitura): nenhum botão funciona', async () => {
    params.value = { partyId: 'p1' };
    renderBackpack([entry('e1', ROPE, 2)], true);

    expect(await screen.findByLabelText('Quantity of Corda de Cânhamo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'One more Corda de Cânhamo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled();
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
    expect(screen.getByRole('button', { name: 'Remove Rope' })).toBeDisabled();
  });

  describe('AddItemDialog', () => {
    async function openDialog(items: ReturnType<typeof entry>[] = []) {
      const user = userEvent.setup();
      renderBackpack(items);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add Item' })).toBeEnabled());
      await user.click(screen.getByRole('button', { name: 'Add Item' }));
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
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
});
