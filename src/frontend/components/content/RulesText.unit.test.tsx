import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RulesText } from './RulesText';

const CONDITIONS = [
  {
    key: 'dnd5e:srd-5.2:condition:frightened',
    id: 'frightened',
    edition: '2024',
    name: 'Amedrontado',
    description: 'Desc 2024.',
  },
];

vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({
    list: CONDITIONS,
    byKey: new Map(CONDITIONS.map((c) => [c.key, c])),
    isLoading: false,
  }),
}));

const ITEMS = [
  {
    key: 'dnd5e:srd-5.2:item:rope',
    id: 'rope',
    edition: '2024',
    category: 'gear',
    name: 'Corda',
    description: 'Cinquenta pés de corda.',
    value: 100,
    weight: 10,
    strength: null,
    stealthDisadvantage: false,
    ac: null,
    damage: null,
    versatile: null,
    properties: [],
    range: null,
    untranslated: false,
  },
  {
    key: 'dnd5e:srd-5.2:item:tinderbox',
    id: 'tinderbox',
    edition: '2024',
    category: 'gear',
    name: 'Isqueiro',
    description: 'Acende fogo.',
    value: 50,
    weight: 1,
    strength: null,
    stealthDisadvantage: false,
    ac: null,
    damage: null,
    versatile: null,
    properties: [],
    range: null,
    untranslated: false,
  },
];

vi.mock('@frontend/hooks/useItems', () => ({
  useItems: () => ({
    list: ITEMS,
    byKey: new Map(ITEMS.map((i) => [i.key, i])),
    isLoading: false,
  }),
}));

describe('RulesText', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transforma a condição em botão e deixa o resto como texto', () => {
    const { container } = renderWithProviders(
      <RulesText
        text="Fica {@condition frightened||amedrontado} e sofre {@damage 8d6}."
        source="srd-5.2"
      />,
    );
    expect(screen.getByRole('button', { name: 'Amedrontado, condition' })).toBeInTheDocument();
    expect(container.textContent).toBe('Fica amedrontado e sofre 8d6.');
    expect(container.textContent).not.toContain('{@');
  });

  it('condição que não existe no livro vira texto', () => {
    const { container } = renderWithProviders(
      <RulesText text="{@condition nada}" source="srd-5.2" />,
    );
    expect(container.textContent).toBe('nada');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('nested não gera botões', () => {
    const { container } = renderWithProviders(
      <RulesText text="{@condition frightened||amedrontado}" source="srd-5.2" nested />,
    );
    expect(container.textContent).toBe('amedrontado');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('tag aberta aparece como está', () => {
    const { container } = renderWithProviders(
      <RulesText text="{@condition prone" source="srd-5.2" />,
    );
    expect(container.textContent).toBe('{@condition prone');
  });

  it('item do livro vira botão com o texto de exibição e abre os detalhes', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <RulesText text="Use {@item Tinderbox|XPHB|isqueiro} agora." source="srd-5.2" />,
    );
    expect(container.textContent).toBe('Use isqueiro agora.');
    await user.click(screen.getByRole('button', { name: 'Isqueiro, item' }));
    expect(screen.getByText('Acende fogo.')).toBeInTheDocument();
  });

  it('item sem texto de exibição usa o nome da tag, resolvido por slug', () => {
    renderWithProviders(<RulesText text="{@item Rope|XPHB}" source="srd-5.2" />);
    expect(screen.getByRole('button', { name: 'Corda, item' })).toHaveTextContent('Corda');
  });

  it('texto de exibição igual ao nome não repete o nome no rótulo', () => {
    renderWithProviders(<RulesText text="{@item Rope|XPHB|corda}" source="srd-5.2" />);
    expect(screen.getByRole('button', { name: 'Corda, item' })).toHaveTextContent('corda');
  });

  // fireEvent, not userEvent: user-event takes anything inside a disabled fieldset as disabled,
  // while a browser only turns off form controls (and <button>), which is the point here
  const readOnly = () =>
    renderWithProviders(
      <fieldset disabled>
        <RulesText text="Use {@item Tinderbox|XPHB|isqueiro}." source="srd-5.2" />
      </fieldset>,
    );

  it('dentro de um fieldset desligado (ficha somente leitura do mestre) o item abre no clique', async () => {
    readOnly();
    const tag = screen.getByRole('button', { name: 'Isqueiro, item' });
    expect(tag).not.toBeDisabled();
    fireEvent.click(tag);
    expect(await screen.findByText('Acende fogo.')).toBeInTheDocument();
  });

  it('dentro de um fieldset desligado o item abre no Enter', async () => {
    readOnly();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Isqueiro, item' }), { key: 'Enter' });
    expect(await screen.findByText('Acende fogo.')).toBeInTheDocument();
  });

  it('item desconhecido ou de outro livro vira texto, sem botão', () => {
    const { container } = renderWithProviders(
      <RulesText text="{@item Vorpal Sword|DMG} e {@item Tinderbox|XPHB}" source="srd-5.1" />,
    );
    expect(container.textContent).toBe('Vorpal Sword e Tinderbox');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('nested não gera botões de item', () => {
    const { container } = renderWithProviders(
      <RulesText text="{@item Tinderbox|XPHB|isqueiro}" source="srd-5.2" nested />,
    );
    expect(container.textContent).toBe('isqueiro');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
