import { screen, waitFor, within } from '@testing-library/react';
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

function renderDialog(characterClass = '', learnedSpells: string[] = []) {
  const character = {
    ...createDnD5eCharacter('owner', 'Elminster', { class: characterClass }),
    id: 'c1',
  } as DnD5eCharacter;
  return renderWithCharacter(
    <SpellSearchDialog
      isOpen
      onClose={vi.fn()}
      learnedSpells={learnedSpells}
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

    await user.click(screen.getByRole('button', { name: 'Clear filters (2)' }));
    await waitFor(() => expect(lastQuery().class).toBeUndefined());
    expect(lastQuery().edition).toBeUndefined();
    expect(screen.queryByRole('button', { name: /Clear filters/ })).not.toBeInTheDocument();
  });

  it('grimório vazio começa na edição de 2024', async () => {
    renderDialog();

    await waitFor(() => expect(lastQuery().edition).toBe('2024'));
    expect(screen.getByRole('combobox', { name: t.filterLabels.edition })).toHaveTextContent(
      t.editions['2024'],
    );
  });

  it('começa na edição da maioria das magias do grimório', async () => {
    renderDialog('', [
      'dnd5e:srd-5.1:spell:fireball',
      'dnd5e:srd-5.1:spell:shield',
      'dnd5e:srd-5.2:spell:light',
    ]);

    await waitFor(() => expect(lastQuery().edition).toBe('2014'));
  });

  // The same spell in two editions is two cards; learning one doesn't mark the other
  it('a magia aprendida numa edição não aparece aprendida na outra', async () => {
    api.get.mockImplementation(async () => ({
      data: [
        {
          id: 'dnd5e:srd-5.1:spell:fireball',
          edition: '2014',
          name: 'Fireball',
          level: 3,
          school: 'evocation',
          castingTime: 'action',
        },
        {
          id: 'dnd5e:srd-5.2:spell:fireball',
          edition: '2024',
          name: 'Fireball',
          level: 3,
          school: 'evocation',
          castingTime: 'action',
        },
      ],
      total: 2,
    }));
    renderDialog('', ['dnd5e:srd-5.1:spell:fireball']);

    const cards = await screen.findAllByRole('article', { name: /Fireball/ });
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText(messages.characters.learnedBadge)).toBeInTheDocument();
    expect(within(cards[1]).queryByText(messages.characters.learnedBadge)).not.toBeInTheDocument();
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

    const toggle = screen.getByRole('button', { name: 'Filters (2)' });
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

  it('no primeiro carregamento, mostra esqueletos e anuncia que está carregando', async () => {
    let respond: (value: unknown) => void = () => {};
    api.get.mockImplementationOnce(() => new Promise((resolve) => (respond = resolve)));
    renderDialog();

    expect(screen.getByRole('status')).toHaveTextContent(t.loading);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    respond({ data: spells(12), total: 12 });
    expect(await screen.findAllByRole('article')).toHaveLength(12);
    expect(screen.getByRole('status')).toHaveTextContent('12 spells');
  });
});
