import type React from 'react';

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { CombatRow } from './CombatRow';
import { gmRow } from './fixtures';

const CONDITIONS = [
  {
    key: 'dnd5e:srd-5.2:condition:prone',
    id: 'prone',
    edition: '2024',
    name: 'Caído',
    description: 'Caído.',
    maxLevel: null,
  },
];
vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({
    list: CONDITIONS,
    byKey: new Map(CONDITIONS.map((x) => [x.key, x])),
    isLoading: false,
  }),
}));

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

const onConditions = vi.fn();
const rowElement = (
  row = gmRow(),
  waiting = false,
  props: Partial<React.ComponentProps<typeof CombatRow>> = {},
) => (
  <ul>
    <CombatRow
      partyId="party-1"
      row={row}
      waiting={waiting}
      swapWith={[]}
      onSwap={vi.fn()}
      onChange={vi.fn()}
      onRemove={vi.fn()}
      edition="2024"
      onConditionsChange={onConditions}
      {...props}
    />
  </ul>
);
const renderRow = (row = gmRow(), waiting = false) => renderWithProviders(rowElement(row, waiting));
const details = (name = 'Arani') =>
  screen.getByRole('button', { name: fill(t.detailsOf, { name }) });
const open = (name = 'Arani') => userEvent.click(details(name));

const goblin = (overrides = {}) =>
  gmRow({
    participantId: 'p-g',
    characterId: 'goblin',
    side: 'enemy',
    name: 'Goblin',
    hp: { current: 5, max: 7, temp: 1 },
    ...overrides,
  });

describe('CombatRow', () => {
  describe('linha fechada', () => {
    it('linha fechada não tem campo nem botão de edição', () => {
      renderRow(goblin());
      const row = screen.getByRole('listitem');
      expect(within(row).queryAllByRole('textbox')).toHaveLength(0);
      expect(within(row).queryAllByRole('spinbutton')).toHaveLength(0);
      expect(within(row).queryAllByRole('combobox')).toHaveLength(0);
      expect(within(row).getAllByRole('button')).toEqual([details('Goblin')]);
    });

    it('o PV temporário usa a cor de texto com contraste nos dois temas', () => {
      renderRow(goblin());
      const temp = screen.getAllByText('+1').find((el) => el.tagName === 'SPAN');
      expect(temp).toHaveClass('text-warning-flare');
    });

    it('linha fechada mostra iniciativa, nome, @, PV e condições', () => {
      renderRow(
        gmRow({
          ownerUsername: 'rebeca',
          conditions: [{ key: 'dnd5e:srd-5.2:condition:prone', level: null }],
        }),
      );
      const row = screen.getByRole('listitem');
      expect(within(row).getByText('12')).toBeInTheDocument();
      // The sheet opens in a new tab: the link says so after the name, for screen readers
      expect(within(row).getByRole('link', { name: /^Arani/ })).toBeInTheDocument();
      expect(within(row).getByText('@rebeca')).toBeInTheDocument();
      expect(within(row).queryByText(t.player)).not.toBeInTheDocument();
      expect(within(row).getByText('12 / 20')).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: 'Caído, condition' })).toBeInTheDocument();
    });

    it('sem iniciativa mostra um traço', () => {
      renderRow(gmRow({ initiative: null }));
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('jogador sem @ mostra "Jogador"', () => {
      renderRow(gmRow({ ownerUsername: null }));
      expect(screen.getByText(t.player)).toBeInTheDocument();
    });

    it('NPC mostra o selo de estado; visível não tem selo', () => {
      const { unmount } = renderRow(goblin({ visibility: 'hidden' }));
      // The closed row's badge comes first; the open part's controls say it too
      expect(screen.getAllByText(t.visibilityHidden)[0]).toBeVisible();
      expect(screen.getAllByText(t.enemy)[0]).toBeVisible();
      unmount();

      renderRow(goblin());
      // Only the (closed) open part's controls say "Visible": no badge on the closed row
      expect(screen.getByText(t.visibilityVisible)).not.toBeVisible();
      expect(screen.queryByText(t.visibilityHidden)).not.toBeInTheDocument();
    });

    it('com PV 0 o jogador mostra os testes contra a morte', () => {
      renderRow(
        gmRow({ hp: { current: 0, max: 20, temp: 0 }, deathSaves: { successes: 2, failures: 1 } }),
      );
      expect(screen.getByText(fill(t.deathSaves, { successes: 2, failures: 1 }))).toBeVisible();
    });

    it('o nome abre a ficha certa: a da mesa para jogador, a normal para inimigo', () => {
      renderRow();
      expect(screen.getByRole('link', { name: /^Arani/ })).toHaveAttribute(
        'href',
        '/parties/party-1/characters/hero',
      );

      renderRow(goblin());
      expect(screen.getByRole('link', { name: /^Goblin/ })).toHaveAttribute(
        'href',
        '/system/DnD_5e/character/goblin',
      );
    });

    it('não existe mais subir nem descer', async () => {
      renderRow();
      await open();
      expect(screen.queryByRole('button', { name: /^(Move|Subir|Descer)/ })).toBeNull();
      expect(messages.combat).not.toHaveProperty('moveUp');
      expect(messages.combat).not.toHaveProperty('moveDown');
    });

    it('a linha da vez atual brilha e fica marcada com aria-current', () => {
      renderRow(gmRow({ isCurrent: true }));
      expect(screen.getByRole('listitem')).toHaveClass('animate-turn-glow');
      expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true');
      expect(screen.getByText(t.currentTurn)).toBeInTheDocument();
    });

    it('o card usa a cor que o dono escolheu para o personagem', () => {
      renderRow(gmRow({ accentColor: '#16a34a' }));
      expect(screen.getByRole('listitem').style.getPropertyValue('--character-color')).toBe(
        '#16a34a',
      );
    });

    it('a waiting row fades only its art, never its text', async () => {
      renderRow(gmRow(), true);
      const li = screen.getByRole('listitem');
      expect(li.className).not.toMatch(/opacity-|grayscale/);
      expect(li).toHaveClass('group');
      expect(li.querySelector('.bg-character')).toHaveClass('grayscale');

      await open();
      expect(li.querySelector('.bg-character')).not.toHaveClass('grayscale');
    });

    it('fora do combate em andamento, a arte não esmaece', () => {
      renderRow(gmRow(), false);
      expect(screen.getByRole('listitem').querySelector('.bg-character')).not.toHaveClass(
        'grayscale',
      );
    });

    it('sem foto, o retrato mostra o emblema da classe, escondido do leitor de tela', () => {
      const { container } = renderRow();
      // Maga → wizard
      expect(container.querySelector('[data-class]')).toHaveAttribute('data-class', 'wizard');
      expect(
        container.querySelector('[data-class]')!.closest('[aria-hidden="true"]'),
      ).not.toBeNull();
    });

    it('não mostra magia', () => {
      renderRow();
      expect(screen.queryByText(/4\/4|3\/4/)).not.toBeInTheDocument();
    });
  });

  describe('abrir e fechar', () => {
    it('clicar na linha abre; clicar num campo da linha aberta não fecha', async () => {
      renderRow(goblin());
      expect(details('Goblin')).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByText(messages.combatStats.armorClass)).not.toBeVisible();

      await userEvent.click(screen.getByText('5 / 7'));
      expect(details('Goblin')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText(messages.combatStats.armorClass)).toBeVisible();

      await userEvent.click(screen.getByLabelText(fill(t.hpOf, { name: 'Goblin' })));
      await userEvent.click(screen.getByLabelText(fill(t.initiativeOf, { name: 'Goblin' })));
      await userEvent.click(screen.getByRole('button', { name: t.anonymize }));
      expect(details('Goblin')).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(details('Goblin'));
      expect(details('Goblin')).toHaveAttribute('aria-expanded', 'false');
    });

    it('abre na vez do personagem e volta a fechar quando a vez passa', async () => {
      const { rerender } = renderRow(gmRow({ isCurrent: true }));
      expect(details()).toHaveAttribute('aria-expanded', 'true');

      // The GM's choice is dropped once the turn moves on
      await open();
      rerender(rowElement(gmRow({ isCurrent: false })));
      expect(details()).toHaveAttribute('aria-expanded', 'false');
      rerender(rowElement(gmRow({ isCurrent: true })));
      expect(details()).toHaveAttribute('aria-expanded', 'true');
    });

    it('clicar dentro do seletor de condições não fecha a linha', async () => {
      renderRow();
      await open();
      await userEvent.click(
        screen.getByRole('button', { name: fill(t.conditionsOf, { name: 'Arani' }) }),
      );
      await userEvent.click(screen.getByRole('switch', { name: 'Caído' }));
      expect(onConditions).toHaveBeenCalledWith([
        { key: 'dnd5e:srd-5.2:condition:prone', level: null },
      ]);
      // The modal hides the card from the accessibility tree while it is open
      expect(
        screen.getByRole('button', { name: fill(t.detailsOf, { name: 'Arani' }), hidden: true }),
      ).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('linha aberta', () => {
    it('a linha aberta tem iniciativa, PV, visibilidade, lado, condições, abrir ficha e tirar do combate', async () => {
      const onRemove = vi.fn();
      renderWithProviders(rowElement(goblin(), false, { onRemove }));
      await open('Goblin');

      expect(screen.getByLabelText(fill(t.initiativeOf, { name: 'Goblin' }))).toHaveValue(12);
      expect(screen.getByLabelText(fill(t.hpOf, { name: 'Goblin' }))).toHaveValue(5);
      expect(screen.getByLabelText(fill(t.tempHpOf, { name: 'Goblin' }))).toHaveValue(1);
      expect(screen.getByRole('group', { name: 'Goblin' })).toBeVisible();
      expect(
        screen.getByRole('combobox', { name: fill(t.changeSideOf, { name: 'Goblin' }) }),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: fill(t.conditionsOf, { name: 'Goblin' }) }),
      ).toBeVisible();
      // The whole sheet opens over the combat, read-only (an NPC's has "Edit sheet" inside)
      expect(
        screen.getByRole('button', { name: `${messages.sheetViewer.open} Goblin` }),
      ).toBeVisible();
      expect(screen.getByText(messages.combatStats.armorClass)).toBeVisible();
      expect(screen.getByText(t.passivePerception)).toBeVisible();
      expect(screen.getByText(messages.combatStats.speed)).toBeVisible();

      await userEvent.click(
        screen.getByRole('button', { name: fill(t.remove, { name: 'Goblin' }) }),
      );
      expect(onRemove).toHaveBeenCalled();
    });

    it('mostra os modificadores dos atributos', async () => {
      renderRow();
      await open();
      // INT 18 → +4, STR 8 → -1
      expect(screen.getByText('+4')).toBeVisible();
      expect(screen.getByText('-1')).toBeVisible();
    });

    it('o jogador não tem campo de PV; o NPC tem PV e temporário editáveis', async () => {
      const onChange = vi.fn();
      renderRow();
      await open();
      expect(screen.queryByLabelText(fill(t.hpOf, { name: 'Arani' }))).not.toBeInTheDocument();
      expect(screen.getByLabelText(fill(t.initiativeOf, { name: 'Arani' }))).toBeVisible();

      renderWithProviders(rowElement(goblin(), false, { onChange }));
      await open('Goblin');
      const hp = screen.getByLabelText(fill(t.hpOf, { name: 'Goblin' }));
      await userEvent.clear(hp);
      await userEvent.type(hp, '3');
      await userEvent.tab();
      expect(onChange).toHaveBeenCalledWith({ hpCurrent: 3 });
    });

    it('"Trocar com" só aparece com vizinho de mesma iniciativa e grava a troca', async () => {
      const onSwap = vi.fn();
      const { unmount } = renderRow();
      await open();
      expect(screen.queryByRole('button', { name: /^Swap with/ })).toBeNull();
      unmount();

      renderWithProviders(
        rowElement(gmRow(), false, {
          onSwap,
          swapWith: [
            { participantId: 'p-g', name: 'Goblin' },
            { participantId: 'p-b', name: 'Brom' },
          ],
        }),
      );
      await open();
      await userEvent.click(
        screen.getByRole('button', { name: fill(t.swapWith, { name: 'Brom' }) }),
      );
      expect(onSwap).toHaveBeenCalledWith('p-b');
      expect(
        screen.getByRole('button', { name: fill(t.swapWith, { name: 'Goblin' }) }),
      ).toBeVisible();
    });
  });

  describe('ampliar a imagem', () => {
    const view = { name: messages.avatarUpload.viewOf.replace('{name}', 'Arani') };

    it('clicar no avatar abre a imagem ampliada, sem abrir a linha', async () => {
      renderRow(gmRow({ avatarUrl: 'https://img.test/a.webp' }));

      await userEvent.click(screen.getByRole('button', view));
      expect(screen.getByRole('img', { name: 'Arani' })).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
      expect(details()).toHaveAttribute('aria-expanded', 'false');
    });

    it('sem imagem, o avatar não amplia e um clique abre a linha', async () => {
      const { container } = renderRow();
      expect(screen.queryByRole('button', view)).not.toBeInTheDocument();

      await userEvent.click(container.querySelector('[data-class]')!);
      expect(details()).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('controles do mestre sobre NPCs', () => {
    const renderWith = (row: ReturnType<typeof gmRow>, onChange = vi.fn()) => {
      renderWithProviders(rowElement(row, false, { onChange }));
      return onChange;
    };

    it('mostra o lado também no turno do NPC, junto de "Vez atual"', () => {
      renderWith(goblin({ isCurrent: true }));
      expect(screen.getByText(t.currentTurn)).toBeInTheDocument();
      // The badge and the side select's value: without the badge there'd be one
      expect(screen.getAllByText(t.enemy)).toHaveLength(2);
    });

    it('o NPC aliado aparece marcado como aliado', () => {
      renderWith(goblin({ side: 'ally', name: 'Guarda' }));
      // The badge and the side select's value
      expect(screen.getAllByText(t.ally)).toHaveLength(2);
      expect(screen.queryByText(t.enemy)).not.toBeInTheDocument();
    });

    it('NPC aberto mostra as três ações de visibilidade com rótulo', async () => {
      renderWith(goblin({ visibility: 'anonymous' }));
      await open('Goblin');
      expect(screen.getByRole('group', { name: 'Goblin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: t.anonymize })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: t.show })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: t.hide })).toHaveAttribute('aria-pressed', 'false');
    });

    it('clicar no estado atual não envia um patch repetido', async () => {
      const onChange = renderWith(goblin());
      await open('Goblin');
      await userEvent.click(screen.getByRole('button', { name: t.show }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('clicar em Anonimizar chama onChange({ visibility: "anonymous" })', async () => {
      const onChange = renderWith(goblin());
      await open('Goblin');
      await userEvent.click(screen.getByRole('button', { name: t.anonymize }));
      expect(onChange).toHaveBeenCalledWith({ visibility: 'anonymous' });
    });

    it('a ação mostra um tooltip com o mesmo texto, também ao tocar', async () => {
      renderWith(goblin());
      await open('Goblin');
      await userEvent.click(screen.getByRole('button', { name: t.hide }));
      expect(await screen.findByRole('tooltip')).toHaveTextContent(t.hide);
    });

    it('jogador não tem controles de visibilidade nem de lado', async () => {
      renderRow();
      await open();
      expect(screen.queryByRole('button', { name: t.hide })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Arani' })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('combobox', { name: fill(t.changeSideOf, { name: 'Arani' }) }),
      ).not.toBeInTheDocument();
    });

    it('trocar o lado chama onChange({ side: "neutral" })', async () => {
      const onChange = renderWith(goblin());
      await open('Goblin');
      await userEvent.click(
        screen.getByRole('combobox', { name: fill(t.changeSideOf, { name: 'Goblin' }) }),
      );
      await userEvent.click(await screen.findByRole('option', { name: t.neutral }));
      expect(onChange).toHaveBeenCalledWith({ side: 'neutral' });
    });
  });

  describe('NPC caído e morto', () => {
    const npc = (overrides = {}) => goblin({ hp: { current: 0, max: 7, temp: 0 }, ...overrides });
    const renderNpc = (row: ReturnType<typeof gmRow>, onChange = vi.fn()) => {
      renderWithProviders(rowElement(row, false, { onChange }));
      return onChange;
    };

    it('o selo fechado diz caído, morto (não revelado) ou estável', () => {
      const { unmount } = renderWithProviders(rowElement(npc()));
      expect(screen.getAllByText(t.down)[0]).toBeVisible();
      unmount();

      const second = renderWithProviders(rowElement(npc({ fate: 'dead' })));
      expect(screen.getAllByText(t.dead)[0]).toBeVisible();
      second.unmount();

      renderWithProviders(
        rowElement(npc({ fate: 'death_saves', deathSaves: { successes: 3, failures: 1 } })),
      );
      expect(screen.getAllByText(t.deathStable)[0]).toBeVisible();
    });

    it('NPC com 0 PV oferece Testes contra a morte e Morto', async () => {
      const onChange = renderNpc(npc());
      await open('Goblin');
      expect(screen.getByText(fill(t.chooseFate, { name: 'Goblin' }))).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: t.fateDeathSaves }));
      expect(onChange).toHaveBeenCalledWith({ fate: 'death_saves' });
      expect(screen.getByRole('button', { name: t.fateDead })).toBeInTheDocument();
    });

    it('NPC com PV não oferece destino', async () => {
      renderNpc(npc({ hp: { current: 3, max: 7, temp: 0 } }));
      await open('Goblin');
      expect(screen.queryByRole('button', { name: t.fateDead })).not.toBeInTheDocument();
    });

    it('marcar a 2ª falha chama onChange com os contadores', async () => {
      const onChange = renderNpc(
        npc({ fate: 'death_saves', deathSaves: { successes: 0, failures: 0 } }),
      );
      await open('Goblin');
      await userEvent.click(screen.getByRole('button', { name: fill(t.deathFailure, { n: 2 }) }));
      expect(onChange).toHaveBeenCalledWith({ deathSaves: { successes: 0, failures: 2 } });
    });

    it('morto revelado fica recolhido e ainda abre ao clicar', async () => {
      renderNpc(npc({ fate: 'dead', deathRevealed: true }));
      expect(screen.getByText('Goblin').closest('s')).not.toBeNull();
      expect(screen.queryByRole('button', { name: t.hideDeath })).not.toBeInTheDocument();
      await open('Goblin');
      expect(screen.getByRole('button', { name: t.hideDeath })).toBeVisible();
      expect(screen.getByRole('button', { name: t.undoDead })).toBeVisible();
    });

    it('morto revelado na vez atual abre com um clique', async () => {
      renderNpc(npc({ fate: 'dead', deathRevealed: true, isCurrent: true }));
      await open('Goblin');
      expect(screen.getByRole('button', { name: t.hideDeath })).toBeVisible();
    });

    it('jogador com 0 PV continua mostrando só os testes da ficha', async () => {
      renderRow(
        gmRow({
          hp: { current: 0, max: 20, temp: 0 },
          deathSaves: { successes: 1, failures: 2 },
        }),
      );
      expect(screen.getByText(fill(t.deathSaves, { successes: 1, failures: 2 }))).toBeVisible();
      await open();
      expect(screen.queryByRole('button', { name: t.fateDead })).not.toBeInTheDocument();
    });
  });
});
