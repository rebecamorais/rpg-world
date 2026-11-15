import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { EditionCard } from './EditionCard';
import { MONK } from './fixtures';

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@client', () => ({ rpgWorldApi: api }));

const thor = () => ({ ...createDnD5eCharacter('owner', 'Thor'), id: 'c1', class: 'monk' });

describe('EditionCard', () => {
  it('escolher uma edição carrega os recursos e então salva só a edição', async () => {
    api.get.mockResolvedValue(MONK);
    const { saveNow } = renderWithCharacter(<EditionCard classId="monk" />, thor());

    expect(screen.getByText(messages.classResources.newTitle)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2024' }));

    await waitFor(() => expect(saveNow).toHaveBeenCalledWith({ edition: '2024' }));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('edition=2024&class=monk'));
    expect(api.get.mock.invocationCallOrder[0]).toBeLessThan(saveNow.mock.invocationCallOrder[0]);
  });

  it('enquanto salva, os dois botões ficam desabilitados; uma falha libera de novo', async () => {
    api.get.mockResolvedValue(MONK);
    let fail = (_error: Error) => {};
    const { saveNow } = renderWithCharacter(<EditionCard classId="monk" />, thor());
    saveNow.mockImplementationOnce(() => new Promise<void>((_, reject) => (fail = reject)));

    await userEvent.click(screen.getByRole('button', { name: '2014' }));

    await waitFor(() => expect(saveNow).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: '2014' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '2024' })).toBeDisabled();

    fail(new Error('offline'));
    await waitFor(() => expect(screen.getByRole('button', { name: '2024' })).toBeEnabled());
    expect(screen.getByRole('button', { name: '2014' })).toBeEnabled();
  });
});
