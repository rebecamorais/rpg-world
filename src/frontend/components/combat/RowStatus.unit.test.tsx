import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { RowStatus } from './RowStatus';
import { gmRow } from './fixtures';

const t = messages.combat;
const npc = (overrides = {}) => gmRow({ side: 'enemy', name: 'Goblin', ...overrides });

describe('RowStatus', () => {
  it.each([
    [{ visibility: 'hidden' }, t.visibilityHidden],
    [{ visibility: 'anonymous' }, t.visibilityAnonymous],
    [{ hp: { current: 0, max: 7, temp: 0 } }, t.down],
    [{ hp: { current: 0, max: 7, temp: 0 }, fate: 'dead' }, t.dead],
    [
      {
        hp: { current: 0, max: 7, temp: 0 },
        fate: 'death_saves',
        deathSaves: { successes: 3, failures: 0 },
      },
      t.deathStable,
    ],
  ])('NPC %o mostra "%s"', (overrides, text) => {
    renderWithProviders(<RowStatus row={npc(overrides)} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('visível e de pé não tem selo', () => {
    const { container } = renderWithProviders(<RowStatus row={npc()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('oculto e caído mostra os dois', () => {
    renderWithProviders(
      <RowStatus row={npc({ visibility: 'hidden', hp: { current: 0, max: 7, temp: 0 } })} />,
    );
    expect(screen.getByText(t.visibilityHidden)).toBeInTheDocument();
    expect(screen.getByText(t.down)).toBeInTheDocument();
  });

  it('jogador não tem selo', () => {
    const { container } = renderWithProviders(
      <RowStatus row={gmRow({ hp: { current: 0, max: 20, temp: 0 } })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
