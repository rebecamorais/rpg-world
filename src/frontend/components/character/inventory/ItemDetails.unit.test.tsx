import { screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { ItemDetails } from './ItemDetails';

vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn() } }));

const plate: ItemDto = {
  key: 'dnd5e:srd-5.2:item:plate-armor',
  id: 'plate-armor',
  edition: '2024',
  category: 'armor',
  name: 'Plate Armor',
  description: 'Heavy armor. You are {@condition Blinded} by nothing.',
  value: 150000,
  weight: 65,
  strength: 15,
  stealthDisadvantage: true,
  ac: 18,
  damage: null,
  versatile: null,
  properties: [],
  range: null,
  untranslated: false,
};

describe('ItemDetails', () => {
  beforeEach(() => {
    vi.mocked(rpgWorldApi.get).mockResolvedValue([]);
  });

  it('mostra CA, Força, desvantagem em Furtividade, preço e peso da armadura de placas', () => {
    renderWithProviders(<ItemDetails item={plate} />);

    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Disadvantage')).toBeInTheDocument();
    expect(screen.getByText('1,500 GP')).toBeInTheDocument();
    expect(screen.getByText('65 lb')).toBeInTheDocument();
  });

  it('mostra a descrição pelo RulesText, sem o marcador da tag', () => {
    renderWithProviders(<ItemDetails item={plate} />);

    expect(screen.getByText(/Heavy armor\. You are Blinded by nothing\./)).toBeInTheDocument();
    expect(screen.queryByText('In English')).not.toBeInTheDocument();
  });

  it('sem tradução, mostra o texto em inglês com lang="en" e o selo "não traduzido"', () => {
    renderWithProviders(<ItemDetails item={{ ...plate, untranslated: true }} />);

    expect(screen.getByText('In English')).toBeInTheDocument();
    expect(screen.getByText(/Heavy armor/).closest('[lang]')).toHaveAttribute('lang', 'en');
  });

  it('preço fracionário fica em cobre', () => {
    renderWithProviders(<ItemDetails item={{ ...plate, value: 0.1 }} />);

    expect(screen.getByText('0.1 CP')).toBeInTheDocument();
  });
});
