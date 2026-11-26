import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { APIError } from '@frontend/lib/api-client';

import type { ClassData } from '@shared/systems/dnd5e/content/class.schema';
import type { User } from '@shared/types/user';

import NewCharacterForm from './NewCharacterForm';

const push = vi.fn();
let currentUser: User | null = { id: 'user-1' };

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@frontend/context/UserContext', () => ({ useCurrentUser: () => ({ currentUser }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { post: vi.fn(), get: vi.fn() },
}));

const t = messages.characterCreation;
const post = vi.mocked(rpgWorldApi.post);
const get = vi.mocked(rpgWorldApi.get);

const classes = JSON.parse(
  readFileSync(join(process.cwd(), 'content/dnd5e/srd-5.1/classes.json'), 'utf8'),
) as ClassData[];

/** The content API: the class's rules data, as much as the form reads; no items. */
const contentApi = async (url: string) => {
  const query = new URL(url, 'http://localhost').searchParams;
  if (!url.startsWith('/api/content/classes')) return [];
  const data = classes.find((c) => c.id === query.get('class'))!;
  return { classId: data.id, edition: query.get('edition'), ...data };
};

async function pickEdition(name: string) {
  await userEvent.click(screen.getByRole('radio', { name }));
}

async function pickClass(name: string) {
  await userEvent.click(screen.getByRole('combobox', { name: messages.characterHeader.class }));
  await userEvent.click(screen.getByRole('option', { name }));
}

async function createCharacter(name: string) {
  const user = userEvent.setup();
  if (name) await user.type(screen.getByLabelText(t.nameLabel), name);
  await user.click(screen.getByRole('button', { name: t.submit }));
}

describe('NewCharacterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'user-1' };
    post.mockResolvedValue({ id: 'char-1' });
    get.mockImplementation(contentApi as typeof get);
  });

  it('pede login quando não há usuário', () => {
    currentUser = null;
    renderWithProviders(<NewCharacterForm />);

    expect(screen.getByText(t.requireLogin)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.submit })).not.toBeInTheDocument();
  });

  it('cria o personagem de D&D 5e com o nome sem espaços e abre a ficha', async () => {
    renderWithProviders(<NewCharacterForm />);

    await createCharacter('  Thor  ');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/system/dnd5e/character/char-1'));
    expect(post).toHaveBeenCalledWith('/api/characters', {
      name: 'Thor',
      system: 'DnD_5e',
      edition: '2014',
    });
    expect(toast.success).toHaveBeenCalledWith(t.success);
  });

  it('NPC: cria com kind npc e o cancelar volta para a aba de NPCs', async () => {
    renderWithProviders(<NewCharacterForm kind="npc" />);

    expect(screen.getByRole('link', { name: messages.common.cancel })).toHaveAttribute(
      'href',
      '/characters/npcs',
    );
    await createCharacter('Goblin');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/system/dnd5e/character/char-1'));
    expect(post).toHaveBeenCalledWith('/api/characters', {
      name: 'Goblin',
      system: 'DnD_5e',
      edition: '2014',
      kind: 'npc',
    });
  });

  it('exige o nome', async () => {
    renderWithProviders(<NewCharacterForm />);

    await createCharacter('');

    expect(await screen.findByText(t.nameRequired)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('mostra o erro traduzido quando a API recusa', async () => {
    post.mockRejectedValue(new APIError('character_error_create_name_required', 400));
    renderWithProviders(<NewCharacterForm />);

    await createCharacter('Thor');

    const message = messages.common.errors.character_error_create_name_required;
    // Inline only: a toast too would say the same thing twice
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(toast.error).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('começa com a edição 2014 marcada e mostra o único sistema como texto', () => {
    renderWithProviders(<NewCharacterForm />);

    expect(screen.getByRole('radio', { name: messages.sheetSettings.edition2014 })).toBeChecked();
    expect(screen.getByText(t.systems.dnd5e)).toBeInTheDocument();
    // The class is the only list left to pick from
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('nome e classe com o mesmo rótulo e a mesma altura', () => {
    renderWithProviders(<NewCharacterForm />);

    const name = screen.getByLabelText(t.nameLabel);
    const nameLabel = screen.getByText(t.nameLabel);
    const classLabel = screen.getByText(messages.characterHeader.class);
    const classField = screen.getByRole('combobox', { name: messages.characterHeader.class });
    expect(nameLabel).toHaveClass('text-label', 'text-muted-foreground');
    expect(classLabel).toHaveClass('text-label', 'text-muted-foreground');
    expect(name).toHaveClass('h-10');
    expect(classField).toHaveClass('h-10');
  });

  it('sem rede, diz que é a conexão e não um erro desconhecido', async () => {
    post.mockRejectedValue(new TypeError('Failed to fetch'));
    renderWithProviders(<NewCharacterForm />);

    await createCharacter('Thor');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.common.errors.common_error_network,
    );
    expect(push).not.toHaveBeenCalled();
  });

  describe('com classe', () => {
    const edition2014 = messages.sheetSettings.edition2014;

    it('Bardo em 2014: escolhe 2 de 3 perícias e cria assim mesmo', async () => {
      renderWithProviders(<NewCharacterForm />);

      await pickEdition(edition2014);
      await pickClass('Bard');
      const skills = await screen.findByRole('group', { name: t.choiceSkills });
      expect(skills).toHaveAccessibleDescription('0 of 3');

      await userEvent.click(within(skills).getByRole('checkbox', { name: 'Arcana' }));
      await userEvent.click(within(skills).getByRole('checkbox', { name: 'History' }));
      expect(skills).toHaveAccessibleDescription('2 of 3');
      // The Bard also picks 3 instruments
      expect(screen.getByRole('group', { name: t.choiceTools })).toHaveAccessibleDescription(
        '0 of 3',
      );

      await createCharacter('Lia');

      await waitFor(() => expect(push).toHaveBeenCalledWith('/system/dnd5e/character/char-1'));
      expect(post).toHaveBeenCalledWith('/api/characters', {
        name: 'Lia',
        system: 'DnD_5e',
        edition: '2014',
        class: 'bard',
        classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY'] },
      });
    });

    it('com as escolhidas no limite, as outras ficam desabilitadas até desmarcar uma', async () => {
      renderWithProviders(<NewCharacterForm />);

      await pickEdition(edition2014);
      await pickClass('Barbarian');
      const skills = await screen.findByRole('group', { name: t.choiceSkills });
      await userEvent.click(within(skills).getByRole('checkbox', { name: 'Athletics' }));
      await userEvent.click(within(skills).getByRole('checkbox', { name: 'Survival' }));

      expect(skills).toHaveAccessibleDescription('2 of 2');
      expect(within(skills).getByRole('checkbox', { name: 'Nature' })).toBeDisabled();
      await userEvent.click(within(skills).getByRole('checkbox', { name: 'Survival' }));
      expect(within(skills).getByRole('checkbox', { name: 'Nature' })).toBeEnabled();
    });

    it('trocar de classe guarda as escolhas da outra e só manda as da classe atual', async () => {
      renderWithProviders(<NewCharacterForm />);

      await pickEdition(edition2014);
      await pickClass('Barbarian');
      const barbarian = await screen.findByRole('group', { name: t.choiceSkills });
      await userEvent.click(within(barbarian).getByRole('checkbox', { name: 'Athletics' }));

      await pickClass('Wizard');
      const wizard = await screen.findByRole('group', { name: t.choiceSkills });
      await waitFor(() =>
        expect(within(wizard).getByRole('checkbox', { name: 'Arcana' })).toBeInTheDocument(),
      );
      await userEvent.click(within(wizard).getByRole('checkbox', { name: 'Arcana' }));

      await pickClass('Barbarian');
      const back = await screen.findByRole('group', { name: t.choiceSkills });
      await waitFor(() =>
        expect(within(back).getByRole('checkbox', { name: 'Athletics' })).toBeChecked(),
      );
      await createCharacter('Grog');

      await waitFor(() => expect(post).toHaveBeenCalled());
      expect(post.mock.calls[0][1]).toMatchObject({
        class: 'barbarian',
        classChoices: { '2014/barbarian/skills': ['ATHLETICS'] },
      });
    });

    it('sem tocar na edição: a 2014 já marcada pede as escolhas da classe', async () => {
      renderWithProviders(<NewCharacterForm />);

      await pickClass('Cleric');

      expect(await screen.findByRole('group', { name: t.choiceSkills })).toBeInTheDocument();
      expect(screen.queryByText(t.classHint2024)).not.toBeInTheDocument();
      await createCharacter('Pike');

      await waitFor(() => expect(post).toHaveBeenCalled());
      expect(post).toHaveBeenCalledWith('/api/characters', {
        name: 'Pike',
        system: 'DnD_5e',
        edition: '2014',
        class: 'cleric',
      });
    });

    it('em 2024: não pede escolhas e diz que a ficha é preenchida à mão', async () => {
      renderWithProviders(<NewCharacterForm />);

      await pickEdition(messages.sheetSettings.edition2024);
      await pickClass('Cleric');

      expect(screen.getByText(t.classHint2024)).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: t.choiceSkills })).not.toBeInTheDocument();
    });

    it('sem nome não cria, mesmo com as escolhas feitas', async () => {
      renderWithProviders(<NewCharacterForm />);

      await pickEdition(edition2014);
      await pickClass('Barbarian');
      const skills = await screen.findByRole('group', { name: t.choiceSkills });
      await userEvent.click(within(skills).getByRole('checkbox', { name: 'Athletics' }));
      await userEvent.click(within(skills).getByRole('checkbox', { name: 'Survival' }));
      await createCharacter('');

      expect(await screen.findByText(t.nameRequired)).toBeInTheDocument();
      expect(post).not.toHaveBeenCalled();
    });
  });
});
