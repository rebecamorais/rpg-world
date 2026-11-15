import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import pt from '../../../../../messages/pt.json';
import { ResourcesRow } from './ResourcesRow';
import { MONK, PALADIN } from './fixtures';

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({
  useParams: () => params.value,
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const loaded = vi.hoisted(() => ({ content: null as { classId: string } | null }));
vi.mock('@frontend/hooks/useClassResources', () => ({
  useClassResources: (edition: unknown, classId: string | null) => ({
    content: edition && classId && loaded.content?.classId === classId ? loaded.content : null,
    isLoading: false,
  }),
}));

const sheet = (extra: Partial<DnD5eCharacter>): DnD5eCharacter => ({
  ...createDnD5eCharacter('owner', 'Thor'),
  id: 'c1',
  ...extra,
});

const tRes = messages.classResources;
const deathSaves = () => screen.queryByText(messages.savingThrows.deathSaves);
const kiPips = () => screen.getAllByRole('button', { name: /^Ki \d, available$/ });

beforeEach(() => {
  params.value = { id: 'c1' };
  loaded.content = MONK;
});

describe('ResourcesRow', () => {
  it('monge 5 mostra o Ki com 5 usos e a etiqueta de descanso curto', () => {
    renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5, edition: '2014' }));

    expect(screen.getByRole('button', { name: 'Ki' })).toBeInTheDocument();
    expect(kiPips()).toHaveLength(5);
    expect(screen.getByText(tRes.short)).toBeInTheDocument();
    expect(deathSaves()).toBeInTheDocument();
  });

  it('gastar um uso salva o mapa inteiro, sem perder as outras chaves', async () => {
    const other = { used: 2 };
    const { saveNow } = renderWithCharacter(
      <ResourcesRow />,
      sheet({
        class: 'monk',
        level: 5,
        edition: '2014',
        resources: { 'class:barbarian:rage': other },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ki 1, available' }));

    const saved = saveNow.mock.calls[0][0].resources!;
    expect(saved['class:monk:ki'].used).toBe(1);
    expect(saved['class:barbarian:rage']).toEqual(other);
  });

  it('a classe em português ("Monge") também acha o Ki', () => {
    renderWithCharacter(
      <NextIntlClientProvider locale="pt" messages={pt} timeZone="UTC">
        <ResourcesRow />
      </NextIntlClientProvider>,
      sheet({ class: 'Monge', level: 5, edition: '2014' }),
    );

    expect(screen.getByRole('button', { name: 'Ki' })).toBeInTheDocument();
  });

  it('o paladino 5 mostra Lay on Hands como 25 / 25', () => {
    loaded.content = PALADIN;
    renderWithCharacter(<ResourcesRow />, sheet({ class: 'paladin', level: 5, edition: '2014' }));

    expect(screen.getByText('25 / 25')).toBeInTheDocument();
  });

  it('abrir a descrição mostra o texto do recurso', async () => {
    renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5, edition: '2014' }));

    await userEvent.click(screen.getByRole('button', { name: 'Ki' }));

    expect(await screen.findByText('Ki feature text')).toBeInTheDocument();
  });

  it('classe sem catálogo (Artífice) não mostra a linha', () => {
    renderWithCharacter(<ResourcesRow />, sheet({ class: 'Artífice', level: 5, edition: '2014' }));

    expect(screen.queryByRole('heading', { name: tRes.title })).not.toBeInTheDocument();
    expect(deathSaves()).not.toBeInTheDocument();
  });

  it('erro ao carregar o catálogo (sem conteúdo) não mostra a linha nem quebra', () => {
    loaded.content = null;
    renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5, edition: '2014' }));

    expect(screen.queryByRole('heading', { name: tRes.title })).not.toBeInTheDocument();
    expect(deathSaves()).not.toBeInTheDocument();
  });

  it('sem edição mostra o cartão da edição e escolher salva a edição', async () => {
    const { saveNow } = renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5 }));

    expect(screen.getByText(tRes.newTitle)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2024' }));

    expect(saveNow).toHaveBeenCalledWith({ edition: '2024' });
  });

  describe('só leitura', () => {
    beforeEach(() => {
      params.value = { partyId: 'p1', id: 'c1' };
    });

    it('sem edição não mostra nem o cartão nem a linha', () => {
      renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5 }));

      expect(screen.queryByText(tRes.newTitle)).not.toBeInTheDocument();
      expect(deathSaves()).not.toBeInTheDocument();
    });

    it('com caixas, os usos ficam desabilitados e não há "editar"', () => {
      renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5, edition: '2014' }));

      for (const pip of kiPips()) expect(pip).toBeDisabled();
      expect(screen.queryByRole('link', { name: tRes.edit })).not.toBeInTheDocument();
    });
  });

  it('"editar" leva às configurações da ficha', () => {
    renderWithCharacter(
      <ResourcesRow />,
      sheet({ class: 'monk', level: 5, edition: '2014', system: 'DnD_5e' }),
    );

    expect(screen.getByRole('link', { name: tRes.edit })).toHaveAttribute(
      'href',
      '/system/DnD_5e/character/c1/appearance#class-resources',
    );
  });
});
