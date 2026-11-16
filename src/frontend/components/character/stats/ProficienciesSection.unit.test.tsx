import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClassData } from '@shared/systems/dnd5e/content/class.schema';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import ProficienciesSection from './ProficienciesSection';

const classes = JSON.parse(
  readFileSync(join(process.cwd(), 'content/dnd5e/srd-5.1/classes.json'), 'utf8'),
) as ClassData[];

/** The class as the content API sends it (English names), with what the section reads. */
const contentOf = (classId: string) => {
  const data = classes.find((c) => c.id === classId)!;
  const [subclass] = data.subclasses;
  const named = (features: { id: string; level: number }[]) =>
    features.map((f) => ({ ...f, name: NAMES[f.id] ?? f.id }));
  return {
    classId,
    edition: '2014',
    hitDie: data.hitDie,
    proficiencies: data.proficiencies,
    spellcasting: data.spellcasting,
    features: named(data.features),
    subclassFeatures: named(subclass.features),
    subclass: {
      id: subclass.id,
      names: [SUBCLASS_NAMES[subclass.id] ?? subclass.id],
      resources: [],
    },
    resources: [],
    tables: [],
    choices: [],
  };
};
const NAMES: Record<string, string> = {
  druidic: 'Druidic',
  'thieves-cant': "Thieves' Cant",
  'life-domain': 'Life Domain',
};
const SUBCLASS_NAMES: Record<string, string> = { life: 'Life Domain' };

const loaded = vi.hoisted(() => ({ classes: {} as Record<string, unknown> }));
vi.mock('@frontend/hooks/useClassResources', () => ({
  useClassResources: (edition: unknown, classId: string | null) => ({
    content: edition && classId ? (loaded.classes[classId] ?? null) : null,
  }),
}));

vi.mock('@frontend/hooks/useItems', () => ({
  useItems: () => ({
    list: [
      { id: 'lute', edition: '2014', category: 'instrument', name: 'Lute' },
      { id: 'herbalism-kit', edition: '2014', category: 'tool', name: 'Herbalism Kit' },
      { id: 'rapier', edition: '2014', category: 'weapon', name: 'Rapier' },
    ],
    byKey: new Map(),
    isLoading: false,
  }),
}));

const base = createDnD5eCharacter('o', 'x');

function renderSection(extra: Partial<DnD5eCharacter> = {}) {
  return renderWithCharacter(<ProficienciesSection />, {
    ...base,
    id: 'c1',
    level: 1,
    edition: '2014',
    ...extra,
  } as DnD5eCharacter);
}

const group = (name: string) => within(screen.getByRole('region', { name }));
/** The tag of `label` in a group, with its origin (read by screen readers) inside. */
const tag = (name: string, label: string) => group(name).getByText(label).closest('li')!;

async function addFromList(kind: string, option: string) {
  await userEvent.click(screen.getByRole('button', { name: `Add to ${kind}` }));
  await userEvent.click(screen.getByRole('combobox', { name: `New in ${kind}` }));
  await userEvent.click(screen.getByRole('option', { name: option }));
  await userEvent.click(screen.getByRole('button', { name: 'Add' }));
}

async function addOwn(kind: string, text: string) {
  await userEvent.click(screen.getByRole('button', { name: `Add to ${kind}` }));
  await userEvent.click(screen.getByRole('combobox', { name: `New in ${kind}` }));
  await userEvent.click(screen.getByRole('option', { name: 'Other…' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Write it as you want it' }), text);
  await userEvent.click(screen.getByRole('button', { name: 'Add' }));
}

describe('ProficienciesSection', () => {
  beforeEach(() => {
    loaded.classes = Object.fromEntries(
      ['fighter', 'wizard', 'cleric', 'druid', 'rogue'].map((id) => [id, contentOf(id)]),
    );
  });

  it('mostra o que a classe dá, com a origem, sem gravar nada', () => {
    const { draft } = renderSection({ class: 'fighter' });

    expect(tag('Armor', 'Heavy armor')).toHaveTextContent('(From the class)');
    expect(group('Weapons').getByText('Martial weapons')).toBeInTheDocument();
    expect(group('Languages').getByText('None yet')).toBeInTheDocument();
    expect(draft().proficiencies).toBeUndefined();
  });

  it('idioma da lista é salvo pelo id, nunca pelo nome; o próprio fica como digitado', async () => {
    const { draft } = renderSection({ class: 'fighter' });

    await addFromList('Languages', 'Elvish');
    await addOwn('Languages', 'Língua dos Corvos');

    expect(draft().proficiencies).toEqual({
      languages: { added: ['elvish'], own: ['Língua dos Corvos'] },
    });
    expect(tag('Languages', 'Elvish')).toHaveTextContent('(Added by you)');
    expect(tag('Languages', 'Língua dos Corvos')).toHaveTextContent('(Written by you)');
  });

  it('desligar uma da classe e religar', async () => {
    const { draft } = renderSection({ class: 'fighter' });

    await userEvent.click(screen.getByRole('button', { name: 'Turn off Heavy armor' }));
    expect(draft().proficiencies).toEqual({ armor: { off: ['heavy'] } });
    expect(tag('Armor', 'Heavy armor')).toHaveTextContent('(From the class, Turned off)');

    await userEvent.click(screen.getByRole('button', { name: 'Turn Heavy armor back on' }));
    expect(draft().proficiencies).toEqual({});
    expect(screen.getByRole('button', { name: 'Turn off Heavy armor' })).toBeInTheDocument();
  });

  it('trocar de classe mantém as adicionadas e as próprias', () => {
    const proficiencies = {
      tools: { added: ['lute'], own: ['Kit de navegação estelar'] },
    };
    const { unmount } = renderSection({ class: 'fighter', proficiencies });
    expect(group('Tools').getByText('Lute')).toBeInTheDocument();
    unmount();

    renderSection({ class: 'wizard', proficiencies });
    const tools = group('Tools');
    expect(tools.getByText('Lute')).toBeInTheDocument();
    expect(tools.getByText('Kit de navegação estelar')).toBeInTheDocument();
    expect(group('Armor').getByText('None yet')).toBeInTheDocument();
  });

  it('Clérigo: armadura pesada só com o Domínio da Vida, com origem na subclasse', () => {
    const { unmount } = renderSection({ class: 'cleric' });
    expect(group('Armor').queryByText('Heavy armor')).not.toBeInTheDocument();
    unmount();

    renderSection({ class: 'cleric', subclass: 'Life Domain' });
    expect(tag('Armor', 'Heavy armor')).toHaveTextContent('(From the subclass: Life Domain)');
  });

  it('Druida nível 1 tem Druídico; Ladino nível 1 tem Gíria do Ladrão, pela característica', () => {
    const { unmount } = renderSection({ class: 'druid' });
    expect(tag('Languages', 'Druidic')).toHaveTextContent('(From the class feature Druidic)');
    unmount();

    renderSection({ class: 'rogue' });
    expect(tag('Languages', "Thieves' Cant")).toHaveTextContent(
      "(From the class feature Thieves' Cant)",
    );
  });

  it('em 2024 nada vem da classe', () => {
    renderSection({ class: 'fighter', edition: '2024' });

    expect(group('Armor').getByText('None yet')).toBeInTheDocument();
  });
});
