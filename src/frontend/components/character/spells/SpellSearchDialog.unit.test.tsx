import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import type { Spell } from '@frontend/types/spells';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import SpellSearchDialog from './SpellSearchDialog';

vi.mock('@client', () => ({ rpgWorldApi: { get: vi.fn() } }));

const api = vi.mocked(rpgWorldApi);
const t = messages.spellsDrawer;

function spells(count: number, offset = 0): Spell[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `spell-${offset + i}`,
    name: `Spell ${offset + i}`,
    level: 1,
    school: 'evocation',
    castingTime: 'action',
  }));
}

/** Query params of every spell search so far, prefetches of the next page included. */
function queries() {
  return api.get.mock.calls.map(([url]) =>
    Object.fromEntries(new URLSearchParams((url as string).split('?')[1])),
  );
}

/** Query params of the last search the user asked for (not a prefetch of the next page). */
function lastQuery() {
  return queries().findLast((q) => q.page === '0')!;
}

function renderDialog(characterClass = '') {
  const character = {
    ...createDnD5eCharacter('owner', 'Elminster', { class: characterClass }),
    id: 'c1',
  } as DnD5eCharacter;
  return renderWithCharacter(
    <SpellSearchDialog
      isOpen
      onClose={vi.fn()}
      learnedSpells={[]}
      onLearnSpell={vi.fn()}
      onForgetSpell={vi.fn()}
    />,
    character,
  );
}

describe('SpellSearchDialog', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.get.mockImplementation(async (url: string) => {
      const page = Number(new URLSearchParams(url.split('?')[1]).get('page'));
      return { data: spells(12, page * 12), total: 30 };
    });
  });

  it('começa filtrando pela classe do personagem, e dá para limpar', async () => {
    const user = userEvent.setup();
    renderDialog('Wizard');

    await waitFor(() => expect(lastQuery().class).toBe('wizard'));

    await user.click(screen.getByRole('button', { name: 'Clear filters (1)' }));
    await waitFor(() => expect(lastQuery().class).toBeUndefined());
    expect(screen.queryByRole('button', { name: /Clear filters/ })).not.toBeInTheDocument();
  });

  it('sem classe do sistema, mostra todas', async () => {
    renderDialog('Artificer');

    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(lastQuery().class).toBeUndefined();
  });

  it('busca enquanto digita, sem Enter nem botão', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByRole('searchbox', { name: t.searchLabel }), 'fire');

    await waitFor(() => expect(lastQuery().search).toBe('fire'));
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('mostra o intervalo da página e volta à primeira ao mudar a busca', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(await screen.findByText('1–12 of 30 spells')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(await screen.findByText('13–24 of 30 spells')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: t.searchLabel }), 'x');
    await waitFor(() => expect(lastQuery()).toMatchObject({ search: 'x' }));
  });

  it('no celular, os filtros abrem por um botão que conta os ativos', async () => {
    const user = userEvent.setup();
    renderDialog('Wizard');

    const toggle = screen.getByRole('button', { name: 'Filters (1)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(panel).toHaveClass('max-sm:hidden');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveClass('max-sm:hidden');
  });

  it('pré-carrega a próxima página, mas não depois da última', async () => {
    renderDialog();

    await waitFor(() => expect(queries()).toContainEqual(expect.objectContaining({ page: '1' })));
    // 30 spells, 12 per page: pages 0, 1 and 2; page 0 only prefetches page 1
    expect(queries().map((q) => q.page)).toEqual(['0', '1']);
  });
});
