import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import pt from '../../../../../messages/pt.json';
import { ResourcesRow } from './ResourcesRow';
import { MONK, PALADIN } from './fixtures';

/** Monk with a second box, to tap two boxes of the same card. */
const MONK_TWO_BOXES = {
  ...MONK,
  resources: [
    ...MONK.resources,
    { ...MONK.resources[0], id: 'focus', name: 'Focus', description: 'Focus text' },
  ],
};

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
  }),
  classResourcesQuery: (...key: unknown[]) => ({
    queryKey: ['class-resources', ...key],
    queryFn: async () => loaded.content,
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
  });

  it('gastar um uso envia só a chave que mudou', async () => {
    const { sentNow } = renderWithCharacter(
      <ResourcesRow />,
      sheet({
        class: 'monk',
        level: 5,
        edition: '2014',
        resources: { 'class:barbarian:rage': { used: 2 }, 'class:monk:ki': { used: 0 } },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ki 1, available' }));

    expect(sentNow()).toEqual({ resources: { 'class:monk:ki': { used: 1 } } });
  });

  it('o primeiro uso numa ficha sem recursos guardados cria só aquela chave', async () => {
    const { sentNow } = renderWithCharacter(
      <ResourcesRow />,
      sheet({ class: 'monk', level: 5, edition: '2014', resources: undefined }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ki 1, available' }));

    expect(sentNow()).toEqual({ resources: { 'class:monk:ki': { used: 1 } } });
  });

  it('enquanto uma caixinha salva, as outras continuam livres para tocar', async () => {
    loaded.content = MONK_TWO_BOXES;
    const { saveNow } = renderWithCharacter(
      <ResourcesRow />,
      sheet({ class: 'monk', level: 5, edition: '2014' }),
    );
    saveNow.mockImplementationOnce(() => new Promise<void>(() => {}));

    await userEvent.click(screen.getByRole('button', { name: 'Ki 1, available' }));

    const focus = screen.getAllByRole('button', { name: /^Focus \d, available$/ });
    for (const pip of focus) expect(pip).toBeEnabled();
    await userEvent.click(focus[0]);
    expect(saveNow).toHaveBeenCalledTimes(2);
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

  it('sem edição e com classe fora das 12, não oferece o cartão da edição', () => {
    renderWithCharacter(<ResourcesRow />, sheet({ class: 'Artífice', level: 5 }));

    expect(screen.queryByText(tRes.newTitle)).not.toBeInTheDocument();
    expect(deathSaves()).not.toBeInTheDocument();
  });

  it('sem edição mostra o cartão da edição e escolher salva a edição', async () => {
    const { saveNow } = renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5 }));

    expect(screen.getByText(tRes.newTitle)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2024' }));

    await waitFor(() => expect(saveNow).toHaveBeenCalledWith({ edition: '2024' }));
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

    it('a descrição da caixinha abre mesmo só de leitura', async () => {
      renderWithCharacter(
        <SheetFieldset>
          <ResourcesRow />
        </SheetFieldset>,
        sheet({ class: 'monk', level: 5, edition: '2014' }),
      );

      for (const pip of kiPips()) expect(pip).toBeDisabled();
      // fireEvent: user-event skips anything inside a disabled fieldset, while browsers only
      // turn off its form controls
      const trigger = screen.getByRole('button', { name: 'Ki' });
      expect(trigger).toBeEnabled();
      fireEvent.click(trigger);

      expect(await screen.findByText('Ki feature text')).toBeInTheDocument();
    });

    it('com caixas, os usos ficam desabilitados e não há "editar"', () => {
      renderWithCharacter(<ResourcesRow />, sheet({ class: 'monk', level: 5, edition: '2014' }));

      for (const pip of kiPips()) expect(pip).toBeDisabled();
      expect(screen.queryByRole('link', { name: tRes.edit })).not.toBeInTheDocument();
    });
  });

  describe('caixinhas editadas e próprias (#180)', () => {
    const OWN = 'custom:0193a1b2-0000-7000-8000-000000000001';
    const ring = {
      name: 'Ring',
      max: 2,
      recovery: [{ rest: 'long' as const, amount: 'all' as const }],
      source: 'item' as const,
    };

    it('caixinha própria aparece sem edição e em classe fora das 12, no lugar do cartão', () => {
      renderWithCharacter(
        <ResourcesRow />,
        sheet({ class: 'Chef', resources: { [OWN]: { used: 1, custom: ring } } }),
      );

      expect(screen.getByRole('group', { name: 'Ring, 1 of 2 available' })).toBeInTheDocument();
      expect(screen.queryByText(tRes.newTitle)).not.toBeInTheDocument();
    });

    it('caixinha escondida some; escondendo a única, a linha some junto', () => {
      renderWithCharacter(
        <ResourcesRow />,
        sheet({
          class: 'monk',
          level: 5,
          edition: '2014',
          resources: { 'class:monk:ki': { used: 0, hidden: true } },
        }),
      );

      expect(screen.queryByRole('button', { name: 'Ki' })).not.toBeInTheDocument();
      expect(deathSaves()).not.toBeInTheDocument();
    });

    it('usos e nome editados valem na ficha, e a cor da caixinha pinta a linha dela', () => {
      renderWithCharacter(
        <ResourcesRow />,
        sheet({
          class: 'monk',
          level: 5,
          edition: '2014',
          resources: {
            'class:monk:ki': { used: 0, overrides: { max: 3, name: 'Chi', color: '#ef4444' } },
          },
        }),
      );

      expect(screen.getByRole('group', { name: 'Chi, 3 of 3 available' })).toBeInTheDocument();
      const row = screen.getByRole('button', { name: 'Chi' }).closest('li')!;
      expect(row).toHaveClass('character-context');
      expect(row.style.getPropertyValue('--character-color')).toBe('#ef4444');
    });

    it('gastar numa caixinha própria envia a caixinha inteira daquela chave', async () => {
      const { sentNow } = renderWithCharacter(
        <ResourcesRow />,
        sheet({ class: 'Chef', resources: { [OWN]: { used: 0, custom: ring } } }),
      );

      await userEvent.click(screen.getByRole('button', { name: 'Ring 1, available' }));

      expect(sentNow()).toEqual({ resources: { [OWN]: { used: 1, custom: ring } } });
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
