import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Button } from '@frontend/components/ui/button';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { AdjustHitPoints } from './AdjustHitPoints';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const t = messages.combatStats;

function renderAdjust(hp: Partial<DnD5eCharacter> = {}) {
  const character = {
    ...createDnD5eCharacter('o', 'Ada'),
    id: 'c1',
    hpCurrent: 31,
    hpMax: 31,
    hpTemp: 0,
    ...hp,
  } as DnD5eCharacter;
  const result = renderWithCharacter(
    <AdjustHitPoints>
      <Button>{t.adjustHp}</Button>
    </AdjustHitPoints>,
    character,
  );
  return result;
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: t.adjustHp }));
  return screen.getByRole('dialog', { name: t.adjustHp });
}

describe('AdjustHitPoints', () => {
  beforeEach(() => vi.mocked(toast.success).mockClear());

  it('dano salva na hora e fecha a folha', async () => {
    const { saveNow } = renderAdjust();
    await open();

    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '7');
    await userEvent.click(screen.getByRole('button', { name: t.damage }));

    expect(saveNow).toHaveBeenCalledWith({ hpCurrent: 24, hpTemp: 0 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('o dano consome primeiro o PV temporário', async () => {
    const { saveNow } = renderAdjust({ hpCurrent: 20, hpTemp: 5 });
    await open();

    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '8');
    await userEvent.click(screen.getByRole('button', { name: t.damage }));

    expect(saveNow).toHaveBeenCalledWith({ hpCurrent: 17, hpTemp: 0 });
  });

  it('cura e PV temporário', async () => {
    const { saveNow } = renderAdjust({ hpCurrent: 10 });
    await open();
    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '4');
    await userEvent.click(screen.getByRole('button', { name: t.heal }));
    expect(saveNow).toHaveBeenLastCalledWith({ hpCurrent: 14 });

    await open();
    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '6');
    await userEvent.click(screen.getByRole('button', { name: t.setTempHp }));
    expect(saveNow).toHaveBeenLastCalledWith({ hpTemp: 6 });
  });

  it('sem número, nenhum botão age; zero só vale para o temporário', async () => {
    renderAdjust();
    await open();

    expect(screen.getByRole('button', { name: t.damage })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '0');
    expect(screen.getByRole('button', { name: t.heal })).toBeDisabled();
    expect(screen.getByRole('button', { name: t.setTempHp })).toBeEnabled();
  });

  it('o campo aceita só dígitos', async () => {
    renderAdjust();
    await open();

    const field = screen.getByLabelText(t.adjustHpAmount);
    await userEvent.type(field, '-1a2');

    expect(field).toHaveValue('12');
  });

  it('o aviso mostra o novo PV e desfazer devolve o que havia', async () => {
    const { saveNow } = renderAdjust({ hpCurrent: 0, deathSaves: { successes: 1, failures: 2 } });
    await open();
    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '5');
    await userEvent.click(screen.getByRole('button', { name: t.heal }));

    expect(saveNow).toHaveBeenCalledWith({
      hpCurrent: 5,
      deathSaves: { successes: 0, failures: 0 },
    });
    const [message, options] = vi.mocked(toast.success).mock.calls[0];
    expect(message).toBe('HP 5 / 31');

    const undo = (options as unknown as { action: { onClick: () => void } }).action;
    undo.onClick();
    expect(saveNow).toHaveBeenLastCalledWith({
      hpCurrent: 0,
      deathSaves: { successes: 1, failures: 2 },
    });
  });

  it('abre com o foco no campo do número', async () => {
    renderAdjust();
    await open();

    expect(screen.getByLabelText(t.adjustHpAmount)).toHaveFocus();
  });

  it('reabrir com um número esquecido: o que se digita substitui, não soma', async () => {
    renderAdjust();
    await open();
    await userEvent.keyboard('3{Escape}');

    await open();
    await userEvent.keyboard('5');

    expect(screen.getByLabelText(t.adjustHpAmount)).toHaveValue('5');
  });

  it('Tab passa pelas ações e Esc devolve o foco ao botão que abriu', async () => {
    renderAdjust();
    const dialog = await open();
    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '3');

    await userEvent.tab();
    expect(screen.getByRole('button', { name: t.damage })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: t.heal })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: t.setTempHp })).toHaveFocus();
    // The focus stays inside: the next stop is the close button, at the top
    await userEvent.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: t.adjustHp })).toHaveFocus();
  });

  it('depois de aplicar com Enter, o foco volta ao botão que abriu', async () => {
    renderAdjust();
    await open();

    await userEvent.keyboard('7{Enter}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.adjustHp })).toHaveFocus();
  });

  it('Enter aplica Dano, a ação selecionada no começo', async () => {
    const { saveNow } = renderAdjust();
    await open();

    await userEvent.keyboard('7{Enter}');

    expect(saveNow).toHaveBeenCalledTimes(1);
    expect(saveNow).toHaveBeenCalledWith({ hpCurrent: 24, hpTemp: 0 });
  });

  it('depois de usar Cura, Enter aplica Cura', async () => {
    const { saveNow } = renderAdjust({ hpCurrent: 10 });
    await open();
    await userEvent.keyboard('2');
    await userEvent.click(screen.getByRole('button', { name: t.heal }));

    await open();
    expect(screen.getByText('Enter applies: Heal')).toBeInTheDocument();
    await userEvent.keyboard('3{Enter}');

    expect(saveNow).toHaveBeenLastCalledWith({ hpCurrent: 13 });
  });

  it('Enter duas vezes enquanto salva manda uma vez só', async () => {
    const { saveNow } = renderAdjust();
    let finish = () => {};
    saveNow.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
    await open();

    await userEvent.keyboard('5{Enter}{Enter}');

    expect(saveNow).toHaveBeenCalledTimes(1);
    finish();
  });

  it('Enter sem número não faz nada', async () => {
    const { saveNow } = renderAdjust();
    await open();

    await userEvent.keyboard('{Enter}');

    expect(saveNow).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('se salvar falha, a folha continua aberta com o número', async () => {
    const { saveNow } = renderAdjust();
    saveNow.mockRejectedValueOnce(new Error('offline'));
    await open();

    await userEvent.type(screen.getByLabelText(t.adjustHpAmount), '3');
    await userEvent.click(screen.getByRole('button', { name: t.damage }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(t.adjustHpAmount)).toHaveValue('3');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
