import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FieldValidityProvider, useHasFieldErrors } from '@frontend/context/FieldValidityContext';

import type { ClassResourcesContent } from '@shared/systems/dnd5e/class-resources';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { ResourceBoxesEditor } from './ResourceBoxesEditor';
import { MONK, PALADIN } from './fixtures';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'c1' }),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const catalog = vi.hoisted(() => ({ classes: {} as Record<string, unknown> }));
vi.mock('@frontend/hooks/useClassResources', () => ({
  useClassResources: (edition: unknown, classId: string | null) => ({
    content: edition && classId ? (catalog.classes[classId] ?? null) : null,
  }),
}));

const t = messages.resourceEditor;
const KI = 'class:monk:ki';
const OWN = 'custom:0193a1b2-0000-7000-8000-000000000001';
const LONG = [{ rest: 'long' as const, amount: 'all' as const }];
const ring = { name: 'Ring', max: 2, recovery: LONG, source: 'item' as const };

const sheet = (extra: Partial<DnD5eCharacter> = {}): DnD5eCharacter => ({
  ...createDnD5eCharacter('owner', 'Thor'),
  id: 'c1',
  class: 'monk',
  level: 5,
  edition: '2014',
  ...extra,
});

/** Tells whether the page's save would be held, as SaveCharacterButton reads it. */
function SaveState() {
  return <output>{useHasFieldErrors() ? 'held' : 'free'}</output>;
}

const renderEditor = (character = sheet()) =>
  renderWithCharacter(
    <FieldValidityProvider>
      <ResourceBoxesEditor />
      <SaveState />
    </FieldValidityProvider>,
    character,
  );

const open = (name: string) =>
  userEvent.click(screen.getByRole('button', { name: `Edit ${name}` }));
const fields = (name: string) => within(screen.getByRole('group', { name }));
const customKeys = (character: DnD5eCharacter) =>
  Object.keys(character.resources ?? {}).filter((key) => key.startsWith('custom:'));

beforeEach(() => {
  catalog.classes = { monk: MONK, paladin: PALADIN } satisfies Record<
    string,
    ClassResourcesContent
  >;
});

describe('ResourceBoxesEditor', () => {
  it('lista as caixinhas da classe com origem, usos e descanso', () => {
    renderEditor();

    const row = screen.getByText('Ki').closest('li')!;
    expect(row).toHaveTextContent('Class · 5 uses · short · long');
  });

  it('sem caixinha nenhuma, explica de onde elas vêm', () => {
    renderEditor(sheet({ class: 'Chef', edition: undefined }));

    expect(screen.getByText(t.empty)).toBeInTheDocument();
  });

  it('esconder marca a caixinha no rascunho, que continua na lista para mostrar de volta', async () => {
    const { draft } = renderEditor();

    await userEvent.click(screen.getByRole('button', { name: 'Hide Ki' }));

    expect(draft().resources).toEqual({ [KI]: { used: 0, hidden: true } });
    expect(screen.getByText('Ki').closest('li')).toHaveTextContent(t.hidden);

    await userEvent.click(screen.getByRole('button', { name: 'Show Ki' }));
    expect(draft().resources).toEqual({ [KI]: { used: 0 } });
  });

  it('numa caixinha da classe, os campos vêm vazios com o que a classe diz ao fundo', async () => {
    renderEditor();
    await open('Ki');

    expect(fields('Ki').getByLabelText(t.name)).toHaveValue('');
    expect(fields('Ki').getByLabelText(t.name)).toHaveAttribute('placeholder', 'Ki');
    expect(fields('Ki').getByLabelText(t.uses)).toHaveAttribute('placeholder', '5');
    expect(fields('Ki').getByRole('combobox', { name: t.recoveryLabel })).toHaveTextContent(
      t.recoveryAsClass,
    );
    // Where it comes from is the class's to say
    expect(fields('Ki').queryByRole('combobox', { name: t.source })).not.toBeInTheDocument();
  });

  it('mudar os usos e o nome guarda só a edição; apagar volta a seguir a classe', async () => {
    const { draft } = renderEditor(sheet({ resources: { [KI]: { used: 2 } } }));
    await open('Ki');

    await userEvent.type(fields('Ki').getByLabelText(t.uses), '8');
    await userEvent.type(fields('Ki').getByLabelText(t.name), 'Chi');
    expect(draft().resources).toEqual({ [KI]: { used: 2, overrides: { max: 8, name: 'Chi' } } });
    expect(screen.getByText('Chi').closest('li')).toHaveTextContent('8 uses');

    await userEvent.clear(fields('Chi').getByLabelText(t.uses));
    await userEvent.clear(fields('Chi').getByLabelText(t.name));
    expect(draft().resources).toEqual({ [KI]: { used: 2 } });
  });

  it('usos que não são um número não chegam à ficha e seguram o salvar', async () => {
    const { draft } = renderEditor();
    await open('Ki');
    const uses = fields('Ki').getByLabelText(t.uses);

    await userEvent.type(uses, '2x');

    expect(uses).toBeInvalid();
    expect(screen.getByRole('status')).toHaveTextContent('held');
    expect(draft().resources).toEqual({ [KI]: { used: 0, overrides: { max: 2 } } });

    await userEvent.clear(uses);
    expect(screen.getByRole('status')).toHaveTextContent('free');
  });

  it('descrição e cor entram na edição; "voltar ao que a classe diz" tira tudo', async () => {
    const { draft } = renderEditor();
    await open('Ki');

    await userEvent.type(fields('Ki').getByLabelText(t.description), 'Mine');
    await userEvent.click(
      fields('Ki').getByRole('button', { name: messages.profileForm.colors.red }),
    );
    expect(draft().resources).toEqual({
      [KI]: { used: 0, overrides: { description: 'Mine', color: '#ef4444' } },
    });

    await userEvent.click(fields('Ki').getByRole('button', { name: t.sheetColor }));
    expect(draft().resources?.[KI].overrides).toEqual({ description: 'Mine' });

    await userEvent.click(fields('Ki').getByRole('button', { name: t.reset }));
    expect(draft().resources).toEqual({ [KI]: { used: 0 } });
    expect(fields('Ki').queryByRole('button', { name: t.reset })).not.toBeInTheDocument();
  });

  it('criar caixinha abre a nova com o foco no nome, pronta para digitar por cima', async () => {
    const { draft } = renderEditor();

    await userEvent.click(screen.getByRole('button', { name: t.add }));

    const [key] = customKeys(draft());
    expect(draft().resources?.[key]).toEqual({
      used: 0,
      custom: { name: t.newName, max: 1, recovery: LONG, source: 'manual' },
    });
    const name = fields(t.newName).getByLabelText(t.name);
    expect(name).toHaveFocus();

    await userEvent.keyboard('Wild Shape');
    expect(draft().resources?.[key].custom?.name).toBe('Wild Shape');
  });

  it('caixinha própria: muda descanso, origem e usos nela mesma', async () => {
    const { draft } = renderEditor(sheet({ resources: { [OWN]: { used: 1, custom: ring } } }));
    await open('Ring');

    expect(screen.getByText('Ring').closest('li')).toHaveTextContent('Item · 2 uses · long');
    const uses = fields('Ring').getByLabelText(t.uses);
    await userEvent.clear(uses);
    // Its own box always has a count: empty holds the save and keeps the last one
    expect(uses).toBeInvalid();
    expect(draft().resources?.[OWN].custom?.max).toBe(2);
    await userEvent.type(uses, '4');

    expect(draft().resources).toEqual({ [OWN]: { used: 1, custom: { ...ring, max: 4 } } });
  });

  it('caixinha própria sem nome segura o salvar', async () => {
    renderEditor(sheet({ resources: { [OWN]: { used: 0, custom: ring } } }));
    await open('Ring');

    await userEvent.clear(fields('Ring').getByLabelText(t.name));

    expect(screen.getByText(t.nameRequired)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('held');
  });

  it('excluir tira a caixinha da lista e leva o foco para "criar caixinha"', async () => {
    const { draft } = renderEditor(sheet({ resources: { [OWN]: { used: 1, custom: ring } } }));
    await open('Ring');

    await userEvent.click(fields('Ring').getByRole('button', { name: t.remove }));

    expect(screen.queryByText('Ring')).not.toBeInTheDocument();
    // Sent without its box: that is what tells the server to delete it
    expect(draft().resources).toEqual({ [OWN]: { used: 0 } });
    expect(screen.getByRole('button', { name: t.add })).toHaveFocus();
  });

  it('copiar de outra classe cria uma caixinha própria com o recurso no nível da ficha', async () => {
    const { draft } = renderEditor();

    await userEvent.click(screen.getByRole('button', { name: t.copy }));
    await userEvent.click(screen.getByRole('combobox', { name: t.copyClass }));
    await userEvent.click(
      screen.getByRole('option', { name: messages.spellsData.classes.paladin }),
    );
    await userEvent.click(screen.getByRole('combobox', { name: t.copyResource }));
    await userEvent.click(screen.getByRole('option', { name: 'Lay on Hands' }));
    await userEvent.click(screen.getByRole('button', { name: t.copyAdd }));

    const [key] = customKeys(draft());
    expect(draft().resources?.[key]).toEqual({
      used: 0,
      custom: {
        name: 'Lay on Hands',
        description: 'Healing pool',
        max: 25,
        recovery: LONG,
        source: 'class',
      },
    });
  });

  it('sem edição escolhida, copiar pede a edição primeiro', async () => {
    renderEditor(sheet({ edition: undefined }));

    await userEvent.click(screen.getByRole('button', { name: t.copy }));

    expect(screen.getByText(t.copyNeedsEdition)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: t.copyClass })).not.toBeInTheDocument();
  });
});
