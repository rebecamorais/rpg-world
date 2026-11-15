import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InventoryItem } from '@frontend/hooks/useInventory';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { ItemGrid } from './ItemGrid';
import { ItemRow } from './ItemRow';

const PACK: ItemDto = {
  id: 'explorers-pack',
  key: 'dnd5e:srd-5.2:item:explorers-pack',
  name: "Explorer's Pack",
  edition: '2024',
  category: 'gear',
  description: null,
  value: 1000,
  weight: 59,
  strength: null,
  stealthDisadvantage: false,
  ac: null,
  damage: null,
  versatile: null,
  properties: [],
  range: null,
  untranslated: false,
};

const entry = (id: string, quantity = 1): InventoryItem =>
  ({ id, containerId: 'bag1', ref: PACK.key, quantity, item: PACK }) as InventoryItem;

const matchMedia = vi.fn((query: string) => ({ matches: false, media: query }));
// test/setup-dom.ts gives jsdom a no-op scrollIntoView; spied here and restored after each test
let scrollIntoView: MockInstance<Element['scrollIntoView']>;

beforeEach(() => {
  scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
  vi.stubGlobal('matchMedia', matchMedia);
});
afterEach(() => {
  scrollIntoView.mockRestore();
  vi.unstubAllGlobals();
});

function renderGrid(entries = [entry('e1')]) {
  renderWithProviders(
    <ItemGrid entries={entries} onQuantity={vi.fn()} onRemove={vi.fn()} onAdd={vi.fn()} canAdd />,
  );
}

describe('ItemGrid', () => {
  it('o nome do ladrilho quebra só entre palavras, em caixa normal, com o nome inteiro no title', () => {
    renderGrid();

    const name = screen.getByTitle("Explorer's Pack");
    expect(name).toHaveClass('line-clamp-2', 'break-normal', 'hyphens-auto');
    expect(name).not.toHaveClass('break-words');
    expect(name).not.toHaveClass('text-label');
  });

  it('tocar num ladrilho traz o painel para a tela, só o necessário', async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole('button', { name: /Explorer's Pack/ }));

    const panel = screen.getByRole('region', { name: "Explorer's Pack" });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(panel);
  });

  it('com menos movimento pedido, rola sem animação', async () => {
    matchMedia.mockImplementation((query: string) => ({ matches: true, media: query }));
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole('button', { name: /Explorer's Pack/ }));

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
  });
});

describe('ItemRow', () => {
  it('o nome ocupa até duas linhas em vez de ser cortado, com o nome inteiro no title', () => {
    renderWithProviders(
      <ul>
        <ItemRow entry={entry('e1')} onQuantity={vi.fn()} onRemove={vi.fn()} />
      </ul>,
    );

    const name = screen.getByTitle("Explorer's Pack");
    expect(name).toHaveClass('line-clamp-2', 'break-normal');
    expect(name).not.toHaveClass('truncate');
  });
});
