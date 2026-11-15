import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CombatConnection } from './CombatConnection';

describe('CombatConnection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('conectado, não mostra nada', () => {
    renderWithProviders(<CombatConnection live />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('com o canal caído, diz que está reconectando', () => {
    renderWithProviders(<CombatConnection live={false} />);
    expect(screen.getByRole('status')).toHaveTextContent(messages.combat.reconnecting);
  });

  it('offline, diz que está sem conexão', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderWithProviders(<CombatConnection live={false} />);
    expect(screen.getByRole('status')).toHaveTextContent(messages.combat.offline);
  });
});
