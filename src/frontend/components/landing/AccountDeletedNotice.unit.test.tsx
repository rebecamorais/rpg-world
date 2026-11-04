import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountDeletedNotice } from './AccountDeletedNotice';

let query = '';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(query) }));

describe('AccountDeletedNotice', () => {
  beforeEach(() => {
    query = '';
  });

  it('avisa que a conta foi excluída quando a página inicial abre com accountDeleted', () => {
    query = 'accountDeleted=1';
    renderWithProviders(<AccountDeletedNotice />);

    expect(screen.getByRole('status')).toHaveTextContent(messages.accountDeletion.deleted);
  });

  it('não mostra nada na visita comum', () => {
    renderWithProviders(<AccountDeletedNotice />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
