import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import pt from '../../../../../messages/pt.json';
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

  it('mostra categoria, propriedades com versátil e alcance, e o tipo de dano traduzidos (en)', () => {
    const sword: ItemDto = {
      ...plate,
      category: 'weapon',
      ac: null,
      damage: { dice: '1d8', type: 'slashing' },
      versatile: '1d10',
      properties: ['V', 'T', 'XX'],
      range: '20/60',
    };
    renderWithProviders(<ItemDetails item={sword} />);

    expect(screen.getByText('Weapon')).toBeInTheDocument();
    expect(screen.getByText('1d8 Slashing')).toBeInTheDocument();
    expect(screen.getByText('Versatile (1d10), Thrown (20/60), XX')).toBeInTheDocument();
    expect(screen.getByText('Minimum Strength')).toBeInTheDocument();
  });

  it('em português: Força mínima, categoria, Cortante e propriedade', () => {
    const sword: ItemDto = {
      ...plate,
      category: 'weapon',
      damage: { dice: '1d8', type: 'slashing' },
      properties: ['F', 'L'],
    };
    render(
      <NextIntlClientProvider locale="pt" messages={pt} timeZone="UTC">
        <QueryClientProvider client={new QueryClient()}>
          <ItemDetails item={sword} />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Força mínima')).toBeInTheDocument();
    expect(screen.getByText('Arma')).toBeInTheDocument();
    // 65 lb in the pt-BR books' kilograms (1 lb = 0,5 kg)
    expect(screen.getByText('32,5 kg')).toBeInTheDocument();
    expect(screen.getByText('1d8 Cortante')).toBeInTheDocument();
    expect(screen.getByText('Acuidade, Leve')).toBeInTheDocument();
  });
});
