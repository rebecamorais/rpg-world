import { screen } from '@testing-library/react';
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
});
