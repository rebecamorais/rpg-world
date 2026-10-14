import { act, waitFor } from '@testing-library/react';
import { messages, renderHookWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { useCharacterEditor } from './useCharacterEditor';

const fetched = { ...createDnD5eCharacter('owner-1', 'Thor'), id: 'char-1' } as DnD5eCharacter;

type Props = { fetchedCharacter: DnD5eCharacter | undefined; queryError: Error | null };

function renderEditor(initialProps: Props = { fetchedCharacter: fetched, queryError: null }) {
  return renderHookWithProviders((props: Props) => useCharacterEditor(props), { initialProps });
}

describe('useCharacterEditor', () => {
  it('carrega o personagem buscado sem marcar alterações', async () => {
    const { result } = renderEditor();

    await waitFor(() => expect(result.current.character).toEqual(fetched));
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('aplica edições localmente e marca alterações não salvas', async () => {
    const { result } = renderEditor();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    act(() => {
      result.current.handleAttributeChange('STR', 18);
      result.current.handleSkillChange('ATHLETICS', { isProficient: true });
      result.current.handleSavingThrowChange('CON', true);
      result.current.handleBasicInfoChange('name', 'Thor Odinson');
    });

    const character = result.current.character!;
    expect(character.attributes.STR).toBe(18);
    expect(character.skills.ATHLETICS).toEqual({ isProficient: true });
    expect(character.savingThrowProficiencies.CON).toBe(true);
    expect(character.name).toBe('Thor Odinson');
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(fetched.attributes.STR).toBe(10);
  });

  it('edita magia, dados de vida e testes contra a morte', async () => {
    const { result } = renderEditor();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    act(() => {
      result.current.handleSpellcastingSystemChange('points');
      result.current.handleSpellPointsChange('max', 12);
      result.current.handleSpellSlotsChange('1', 4, 1);
      result.current.handleHitDiceChange('5d10');
      result.current.handleDeathSavesChange(2, 1);
    });

    expect(result.current.character).toMatchObject({
      spellcastingSystem: 'points',
      spellPoints: { max: 12, current: 0 },
      spellSlots: { '1': { max: 4, used: 1 } },
      hitDice: { total: '5d10', current: 0 },
      deathSaves: { successes: 2, failures: 1 },
    });
  });

  it('não sobrescreve edições locais quando chega um refetch', async () => {
    const { result, rerender } = renderEditor();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    act(() => result.current.handleBasicInfoChange('name', 'Local edit'));
    rerender({ fetchedCharacter: { ...fetched, name: 'From server' }, queryError: null });
    await act(async () => {});

    expect(result.current.character?.name).toBe('Local edit');
  });

  it('volta a acompanhar o servidor depois que as alterações são salvas', async () => {
    const { result, rerender } = renderEditor();
    await waitFor(() => expect(result.current.character).not.toBeNull());

    act(() => result.current.handleBasicInfoChange('name', 'Saved'));
    act(() => result.current.setHasUnsavedChanges(false));
    rerender({ fetchedCharacter: { ...fetched, name: 'Saved' }, queryError: null });

    await waitFor(() => expect(result.current.character?.name).toBe('Saved'));
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('traduz o erro da busca e limpa a mensagem na próxima edição', async () => {
    const { result } = renderEditor({
      fetchedCharacter: fetched,
      queryError: new Error('character_error_not_found'),
    });

    await waitFor(() =>
      expect(result.current.error).toBe(messages.common.errors.character_error_not_found),
    );

    act(() => result.current.markDirty());

    expect(result.current.error).toBe('');
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('ignora edições antes de o personagem carregar', () => {
    const { result } = renderEditor({ fetchedCharacter: undefined, queryError: null });

    act(() => result.current.handleAttributeChange('STR', 18));

    expect(result.current.character).toBeNull();
  });

  it('controla a gaveta de magias localmente quando ninguém a controla de fora', () => {
    const { result } = renderEditor();

    act(() => result.current.setIsSpellsOpen(true));

    expect(result.current.isSpellsOpen).toBe(true);
  });
});
