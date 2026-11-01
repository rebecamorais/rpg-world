import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { MyPartyCharacters } from './MyPartyCharacters';

const t = messages.parties.mine;

const characters = [
  { id: 'a', name: 'Arani', level: 1, class: 'Maga' },
  { id: 'b', name: 'Borin', level: 2, class: 'Guerreiro' },
  { id: 'c', name: 'Cael', level: 3, class: 'Ladino' },
];

describe('MyPartyCharacters', () => {
  it('envia só os ids marcados', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <MyPartyCharacters
        characters={characters}
        selected={['a']}
        onSave={onSave}
        isSaving={false}
      />,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole('checkbox', { name: /Arani/ }));
    await user.click(screen.getByRole('checkbox', { name: /Cael/ }));
    await user.click(screen.getByRole('button', { name: t.save }));

    expect(onSave).toHaveBeenCalledWith(['c']);
  });

  it('sem mudança o salvar fica desabilitado', () => {
    renderWithProviders(
      <MyPartyCharacters
        characters={characters}
        selected={['a']}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    expect(screen.getByRole('checkbox', { name: /Arani/ })).toBeChecked();
    expect(screen.getByRole('button', { name: t.save })).toBeDisabled();
  });

  it('sem personagens diz isso', () => {
    renderWithProviders(
      <MyPartyCharacters characters={[]} selected={[]} onSave={vi.fn()} isSaving={false} />,
    );

    expect(screen.getByText(t.none)).toBeInTheDocument();
  });
});
