import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { ConditionBadge } from './ConditionBadge';
import { ConditionHint } from './ConditionHint';

const CONDITIONS = [
  {
    key: 'dnd5e:srd-5.2:condition:exhaustion',
    id: 'exhaustion',
    edition: '2024',
    name: 'Exaustão',
    description: 'Lista 2024.\n• um',
    maxLevel: 6,
  },
  {
    key: 'dnd5e:srd-5.1:condition:exhaustion',
    id: 'exhaustion',
    edition: '2014',
    name: 'Exaustão',
    description: 'Níveis 2014.',
    maxLevel: 6,
  },
  {
    key: 'dnd5e:srd-5.1:condition:prone',
    id: 'prone',
    edition: '2014',
    name: 'Caído',
    description: 'Caído 2014.',
    maxLevel: null,
    untranslated: true,
  },
];

vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({
    list: CONDITIONS,
    byKey: new Map(CONDITIONS.map((c) => [c.key, c])),
    isLoading: false,
  }),
}));

const EX_2024 = 'dnd5e:srd-5.2:condition:exhaustion';

describe('ConditionHint', () => {
  it('abre ao clicar e fecha com Esc', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConditionHint conditionKey={EX_2024} />);

    await user.click(screen.getByRole('button', { name: 'Exaustão, condition' }));
    expect(screen.getByText(/Lista 2024\./)).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText(/Lista 2024\./)).not.toBeInTheDocument();
  });

  it('troca para a versão do outro livro', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConditionHint conditionKey={EX_2024} />);

    await user.click(screen.getByRole('button', { name: 'Exaustão, condition' }));
    await user.click(screen.getByRole('button', { name: 'See 2014 version' }));

    expect(screen.getByText('Níveis 2014.')).toBeInTheDocument();
    expect(screen.queryByText(/Lista 2024/)).not.toBeInTheDocument();
  });

  it('o nome acessível contém a palavra visível quando difere do nome', () => {
    renderWithProviders(
      <ConditionHint conditionKey="dnd5e:srd-5.1:condition:prone" label="caída" />,
    );
    expect(screen.getByRole('button', { name: 'caída (Caído), condition' })).toHaveTextContent(
      'caída',
    );
  });

  it('o popover tem o nome da condição e marca o texto em inglês', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConditionHint conditionKey="dnd5e:srd-5.1:condition:prone" />);
    await user.click(screen.getByRole('button', { name: 'Caído, condition' }));

    expect(screen.getByRole('dialog', { name: /Caído/ })).toBeInTheDocument();
    expect(screen.getByText('Caído 2014.').closest('[lang]')).toHaveAttribute('lang', 'en');
  });

  it('não marca idioma quando a descrição está traduzida', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConditionHint conditionKey={EX_2024} />);
    await user.click(screen.getByRole('button', { name: 'Exaustão, condition' }));
    expect(screen.getByText(/Lista 2024\./).closest('[lang]')).toBeNull();
  });

  it('não oferece troca quando só existe num livro', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConditionHint conditionKey="dnd5e:srd-5.1:condition:prone" />);
    await user.click(screen.getByRole('button', { name: 'Caído, condition' }));
    expect(screen.queryByRole('button', { name: /See/ })).not.toBeInTheDocument();
  });
});

describe('ConditionBadge', () => {
  it('mostra o nível', () => {
    renderWithProviders(<ConditionBadge conditionKey={EX_2024} level={3} defaultEdition="2024" />);
    expect(screen.getByRole('button', { name: 'Exaustão 3, condition' })).toHaveTextContent(
      'Exaustão 3',
    );
  });

  it('o nome acessível inclui o nível e a edição visíveis', () => {
    renderWithProviders(
      <>
        <ConditionBadge conditionKey={EX_2024} level={3} defaultEdition="2024" />
        <ConditionBadge conditionKey="dnd5e:srd-5.1:condition:prone" defaultEdition="2024" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Exaustão 3, condition' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Caído · 2014, condition' })).toBeInTheDocument();
  });

  it('mostra a edição quando difere da padrão', () => {
    renderWithProviders(
      <ConditionBadge conditionKey="dnd5e:srd-5.1:condition:prone" defaultEdition="2024" />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('2014');
  });

  it('chave desconhecida vira texto sem botão', () => {
    renderWithProviders(<ConditionBadge conditionKey="dnd5e:srd-5.2:condition:nada" />);
    expect(screen.getByText('nada')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
