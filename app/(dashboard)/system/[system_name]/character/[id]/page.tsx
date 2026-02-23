'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import AttributesSection from '@/frontend/components/AttributesSection';
import CharacterHeader from '@/frontend/components/CharacterHeader';
import CombatStatsSection from '@/frontend/components/CombatStatsSection';
import KnownSpellsCard from '@/frontend/components/KnownSpellsCard';
import MagicSystemCard from '@/frontend/components/MagicSystemCard';
import PassivePerception from '@/frontend/components/PassivePerception';
import SavingThrowsSection from '@/frontend/components/SavingThrowsSection';
import SkillsSection from '@/frontend/components/SkillsSection';
import SpellsDrawer from '@/frontend/components/SpellsDrawer';
import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/frontend/components/ui/dialog';
import { useCurrentUser } from '@/frontend/context/UserContext';
import { useCharacter } from '@/frontend/hooks/useCharacter';
import type { AttributeKey, DnD5eCharacter } from '@/systems/dnd5e';
import { getProficiencyBonus } from '@/systems/dnd5e/calculations';
import type { SkillKey } from '@/systems/dnd5e/constants';
import type { CharacterSkill } from '@/systems/dnd5e/types';

export default function CharacterDetailPage() {
  const params = useParams();

  const [error, setError] = useState('');
  const [isSpellsOpen, setIsSpellsOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { currentUser } = useCurrentUser();
  const id = params?.id as string;
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

  const {
    character: fetchedCharacter,
    isLoading,
    error: queryError,
    deleteCharacter,
    updateCharacter,
    isSaving,
  } = useCharacter(id, currentUser);

  const [character, setCharacter] = useState<DnD5eCharacter | null>(null);

  const handleDelete = () => {
    if (character) {
      deleteCharacter(character);
    }
  };

  const updateCharacterInBackend = () => {
    if (character) {
      updateCharacter(character, {
        onSuccess: () => {
          setHasUnsavedChanges(false);
        },
      });
    }
  };

  // Sync fetched data to local state buffer for optimistic UI edits
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active && fetchedCharacter && !hasUnsavedChanges) {
        setCharacter(fetchedCharacter);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchedCharacter, hasUnsavedChanges]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active && queryError) {
        setError(queryError.message);
      }
    });
    return () => {
      active = false;
    };
  }, [queryError]);

  if (!currentUser) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">{t('requireLogin')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    );
  }

  if (!character || character.ownerUsername !== currentUser.username) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">{t('notFoundOrNoPermission')}</p>
        <Link href="/characters" className="mt-2 text-sm underline">
          {tCommon('back')}
        </Link>
      </div>
    );
  }

  const handleAttributeChange = (key: AttributeKey, value: number) => {
    setError('');

    // Recalcular Percepção Passiva caso WIS seja modificado
    let newPassivePerception = character?.passivePerception ?? 10;
    if (key === 'WIS' && character) {
      const wisMod = Math.floor((value - 10) / 2);
      const isProficient = character.skills?.PERCEPTION?.isProficient;
      newPassivePerception =
        10 + wisMod + (isProficient ? getProficiencyBonus(character.level) : 0);
    }

    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            attributes: { ...prev.attributes, [key]: value } as Record<
              AttributeKey,
              number
            >,
            passivePerception: newPassivePerception,
          } as DnD5eCharacter)
        : null,
    );

    setHasUnsavedChanges(true);
  };

  const handleSkillChange = (key: SkillKey, skillData: CharacterSkill) => {
    setError('');

    // Recalcular Percepção Passiva caso Percepção seja alterada
    let newPassivePerception = character?.passivePerception ?? 10;
    if (key === 'PERCEPTION' && character) {
      const wisMod = character.attributes.WIS
        ? Math.floor((character.attributes.WIS - 10) / 2)
        : 0;
      newPassivePerception =
        10 +
        wisMod +
        (skillData.isProficient ? getProficiencyBonus(character.level) : 0);
    }

    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            skills: { ...prev.skills, [key]: skillData },
            passivePerception: newPassivePerception,
          } as DnD5eCharacter)
        : null,
    );

    setHasUnsavedChanges(true);
  };

  const handleSavingThrowChange = (
    key: AttributeKey,
    isProficient: boolean,
  ) => {
    setError('');
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            savingThrowProficiencies: {
              ...prev.savingThrowProficiencies,
              [key]: isProficient,
            } as Record<AttributeKey, boolean>,
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  };

  const handleBasicInfoChange = (
    field: keyof DnD5eCharacter,
    value: string | number,
  ) => {
    setError('');
    setCharacter((prev) =>
      prev ? ({ ...prev, [field]: value } as DnD5eCharacter) : null,
    );
    setHasUnsavedChanges(true);
  };

  const handleSpellPointsChange = (field: 'current' | 'max', value: number) => {
    setError('');
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            spellPoints: {
              current: prev.spellPoints?.current ?? 0,
              max: prev.spellPoints?.max ?? 0,
              [field]: value,
            },
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  };

  const handleSpellSlotsChange = (level: string, max: number, used: number) => {
    setError('');
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            spellSlots: {
              ...prev.spellSlots,
              [level]: { max, used },
            },
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  };

  const handleSpellcastingSystemChange = (system: 'slots' | 'points') => {
    setError('');
    setCharacter((prev) =>
      prev ? ({ ...prev, spellcastingSystem: system } as DnD5eCharacter) : null,
    );
    setHasUnsavedChanges(true);
  };

  const handleLearnSpell = (spellIndex: string) => {
    const currentSpells = character.spellsKnown || [];
    if (!currentSpells.includes(spellIndex)) {
      setCharacter((prev) =>
        prev
          ? ({
              ...prev,
              spellsKnown: [...currentSpells, spellIndex],
            } as DnD5eCharacter)
          : null,
      );
      setHasUnsavedChanges(true);
    }
  };

  const handleForgetSpell = (spellIndex: string) => {
    const currentSpells = character.spellsKnown || [];
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            spellsKnown: currentSpells.filter((s) => s !== spellIndex),
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  };

  const pb = getProficiencyBonus(character.level);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/characters"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Voltar
          </Link>
          {hasUnsavedChanges && (
            <span className="rounded bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Alterações não salvas
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={updateCharacterInBackend}
            disabled={!hasUnsavedChanges || isSaving}
            className="bg-primary rounded px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Excluir
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Excluir personagem?</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir o personagem{' '}
                  <span className="text-foreground font-bold">
                    {character?.name}
                  </span>
                  ? Essa ação não poderá ser desfeita e todos os dados serão
                  perdidos.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 gap-2 sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Confirmar Exclusão
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-6">
        {/* Header Block Editable */}
        <CharacterHeader
          name={character.name}
          classNameStr={character.class || ''}
          level={character.level}
          race={character.race || ''}
          pb={pb}
          onBasicInfoChange={handleBasicInfoChange}
          onOpenSpells={() => setIsSpellsOpen(true)}
        />

        {/* Combat Stats */}
        <CombatStatsSection
          character={character}
          onBasicInfoChange={handleBasicInfoChange}
        />

        {/* Main Grid: Attr on Left, Saves/Skills on Center, Spells on Right */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Col 1: Attributes */}
          <div className="md:col-span-2">
            <AttributesSection
              attributes={character.attributes}
              onAttributeChange={handleAttributeChange}
            />
          </div>

          {/* Col 2: Saving Throws, Skills, Passive Perception */}
          <div className="flex flex-col gap-6 md:col-span-4">
            <PassivePerception
              wisValue={character.attributes.WIS ?? 10}
              level={character.level}
              perceptionSkillData={character.skills?.PERCEPTION}
            />

            <SavingThrowsSection
              attributes={character.attributes}
              level={character.level}
              savingThrows={character.savingThrowProficiencies}
              onSavingThrowChange={handleSavingThrowChange}
            />

            <SkillsSection
              attributes={character.attributes}
              level={character.level}
              skills={character.skills ?? {}}
              onSkillChange={handleSkillChange}
            />
          </div>

          {/* Col 3: Magic System and Known Spells */}
          <div className="flex flex-col gap-6 md:col-span-4">
            <MagicSystemCard
              character={character}
              onChangeSystem={handleSpellcastingSystemChange}
              onChangePoints={handleSpellPointsChange}
              onChangeSlots={handleSpellSlotsChange}
            />

            <KnownSpellsCard
              spellsKnown={character.spellsKnown || []}
              onForgetSpell={handleForgetSpell}
            />
          </div>
        </div>
      </div>

      {/* Drawer Extensível de Magias */}
      <SpellsDrawer
        isOpen={isSpellsOpen}
        onClose={() => setIsSpellsOpen(false)}
        learnedSpells={character?.spellsKnown || []}
        onLearnSpell={handleLearnSpell}
        onForgetSpell={handleForgetSpell}
      />
    </div>
  );
}
