import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { AccountCard } from './AccountCard';

const t = messages.profileAccount;

describe('AccountCard', () => {
  it('mostra o e-mail, só para leitura, e leva à troca de senha', () => {
    renderWithProviders(<AccountCard email="hero@example.com" hasPassword />);

    expect(screen.getByText('hero@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.changePassword })).toHaveAttribute(
      'href',
      '/change-password',
    );
    expect(screen.queryByRole('link', { name: t.createPassword })).not.toBeInTheDocument();
  });

  it('conta sem senha (link mágico ou Google) cria a senha pelo "esqueci a senha"', () => {
    renderWithProviders(<AccountCard email="hero@example.com" hasPassword={false} />);

    expect(screen.getByRole('link', { name: t.createPassword })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(screen.queryByRole('link', { name: t.changePassword })).not.toBeInTheDocument();
  });

  it('de volta da troca de senha, confirma que trocou', () => {
    renderWithProviders(<AccountCard email="hero@example.com" hasPassword passwordChanged />);

    expect(screen.getByRole('status')).toHaveTextContent(t.passwordChanged);
  });
});
