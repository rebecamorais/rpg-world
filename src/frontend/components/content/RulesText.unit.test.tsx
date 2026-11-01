import { screen } from '@testing-library/react';
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
});
