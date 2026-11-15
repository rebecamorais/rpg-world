import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { describe, expect, it, vi } from 'vitest';

import { buildResourceBoxes } from '@shared/systems/dnd5e/class-resources';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { ResourcesCard } from './ResourcesCard';
import { MONK } from './fixtures';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }));

describe('ResourcesCard', () => {
  it('mostra o nome, uma caixa por uso e o id da âncora', () => {
    const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1', level: 3 };
    const boxes = buildResourceBoxes({
      content: MONK,
      subclassId: null,
      level: 3,
      attributes: character.attributes,
      state: undefined,
    });
    const { container } = renderWithCharacter(<ResourcesCard boxes={boxes} />, character);

    expect(screen.getByRole('button', { name: 'Ki' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Ki \d, available$/ })).toHaveLength(3);
    expect(container.querySelector('#sheet-resources')).not.toBeNull();
  });

  const boxesOf = (untranslated: boolean) =>
    buildResourceBoxes({
      content: {
        ...MONK,
        resources: MONK.resources.map((r) => ({ ...r, ...(untranslated && { untranslated }) })),
      },
      subclassId: null,
      level: 3,
      attributes: createDnD5eCharacter('owner', 'Thor').attributes,
      state: undefined,
    });

  it('regra ainda em inglês: aviso de sem tradução e lang="en" no texto', async () => {
    const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1', level: 3 };
    renderWithCharacter(<ResourcesCard boxes={boxesOf(true)} />, character);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Ki' }));

    expect(await screen.findByRole('note')).toHaveTextContent('Description in English for now.');
    expect(screen.getByText('Ki feature text').closest('[lang]')).toHaveAttribute('lang', 'en');
  });

  it('regra traduzida: sem aviso e sem lang', async () => {
    const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1', level: 3 };
    renderWithCharacter(<ResourcesCard boxes={boxesOf(false)} />, character);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Ki' }));

    expect(await screen.findByText('Ki feature text')).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(screen.getByText('Ki feature text').closest('[lang]')).toBeNull();
  });
});
