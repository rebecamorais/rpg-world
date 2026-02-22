'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { BookOpen, Eye, Footprints, Heart, Shield, Swords } from 'lucide-react';

import AttributesSection from '@/frontend/components/AttributesSection';
import PassivePerception from '@/frontend/components/PassivePerception';
import SavingThrowsSection from '@/frontend/components/SavingThrowsSection';
import SkillsSection from '@/frontend/components/SkillsSection';
import SpellsDrawer from '@/frontend/components/SpellsDrawer';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Input } from '@/frontend/components/ui/input';
import { useCurrentUser } from '@/frontend/context/UserContext';
import type { AttributeKey, DnD5eCharacter } from '@/systems/dnd5e';
import { getProficiencyBonus } from '@/systems/dnd5e/calculations';
import type { SkillKey } from '@/systems/dnd5e/constants';
import type { CharacterSkill } from '@/systems/dnd5e/types';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [error, setError] = useState('');
  const [isSpellsOpen, setIsSpellsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { currentUser } = useCurrentUser();
  const id = params?.id as string;

  const [character, setCharacter] = useState<DnD5eCharacter | null>(null);

  useEffect(() => {
    if (!currentUser || !id) return;

    setIsLoading(true);
    fetch(`/api/characters/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCharacter(data as DnD5eCharacter);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id, currentUser]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">
          Faça login para ver o personagem.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!character || character.ownerUsername !== currentUser.username) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">
          Personagem não encontrado ou você não tem permissão.
        </p>
        <Link href="/characters" className="mt-2 block text-sm underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Excluir este personagem? Não é possível desfazer.')) {
      try {
        const res = await fetch(
          `/api/characters/${character.id}?ownerUsername=${encodeURIComponent(currentUser.username)}`,
          {
            method: 'DELETE',
          },
        );
        if (res.ok) {
          router.push('/characters');
        } else {
          const data = await res.json();
          setError(data.error || 'Erro ao deletar personagem.');
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Erro ao deletar personagem',
        );
      }
    }
  };

  const updateCharacterInBackend = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/characters/${character?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUsername: currentUser.username,
          updates: character, // We send the whole character state buffered in React
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao salvar no servidor.');
      }
      setHasUnsavedChanges(false);
      alert('Personagem salvo com sucesso!');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Falha ao salvar no servidor.',
      );
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleLearnSpell = (spellIndex: string) => {
    const currentSpells = character.spells || [];
    if (!currentSpells.includes(spellIndex)) {
      setCharacter((prev) =>
        prev
          ? ({
              ...prev,
              spells: [...currentSpells, spellIndex],
            } as DnD5eCharacter)
          : null,
      );
      setHasUnsavedChanges(true);
    }
  };

  const handleForgetSpell = (spellIndex: string) => {
    const currentSpells = character.spells || [];
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            spells: currentSpells.filter((s) => s !== spellIndex),
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  };

  const pb = getProficiencyBonus(character.level);

  return (
    <div className="mx-auto max-w-2xl p-4">
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
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Excluir
          </button>
        </div>
      </div>
      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-6">
        {/* Header Block Editable */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col p-0 md:flex-row">
            <div className="flex flex-col justify-end border-b border-zinc-800 p-6 md:w-2/3 md:border-r md:border-b-0">
              <Input
                value={character.name}
                onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                className="focus-visible:border-primary h-auto rounded-none border-transparent bg-transparent px-0 text-3xl font-bold focus-visible:border-b focus-visible:ring-0"
                placeholder="Nome do Personagem"
              />
              <div className="mt-2 flex gap-4">
                <div className="text-muted-foreground text-sm">
                  Bônus de Proficiência:{' '}
                  <span className="text-primary font-bold">+{pb}</span>
                </div>
              </div>
            </div>
            <div className="bg-muted grid grid-cols-2 gap-4 p-6 md:w-1/3">
              <div>
                <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Classe
                </label>
                <Input
                  value={character.class || ''}
                  onChange={(e) =>
                    handleBasicInfoChange('class', e.target.value)
                  }
                  className="focus-visible:border-primary h-7 rounded-none border-b border-zinc-800 bg-transparent px-1 py-0 text-sm focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Nível
                </label>
                <Input
                  type="number"
                  min={1}
                  value={character.level}
                  onChange={(e) =>
                    handleBasicInfoChange(
                      'level',
                      parseInt(e.target.value) || 1,
                    )
                  }
                  className="focus-visible:border-primary h-7 rounded-none border-b border-zinc-800 bg-transparent px-1 py-0 text-sm focus-visible:ring-0"
                />
              </div>
              <div className="col-span-2">
                <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Raça
                </label>
                <Input
                  value={character.race || ''}
                  onChange={(e) =>
                    handleBasicInfoChange('race', e.target.value)
                  }
                  className="focus-visible:border-primary h-7 rounded-none border-b border-zinc-800 bg-transparent px-1 py-0 text-sm focus-visible:ring-0"
                />
              </div>
              <div className="col-span-2 mt-2">
                <button
                  onClick={() => setIsSpellsOpen(true)}
                  className="border-primary/30 bg-primary/10 hover:bg-primary/20 flex w-full items-center justify-center gap-2 rounded border py-2 text-xs font-semibold text-[#be8be8] transition-colors"
                >
                  <BookOpen size={14} />
                  Grimório de Magias
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combat Stats Block (Lucide Icons) */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Card className="group border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
            <div className="z-10 flex flex-col items-center">
              <Shield className="text-primary mb-2 h-6 w-6 drop-shadow-md" />
              <Input
                type="number"
                value={character.ac}
                onChange={(e) =>
                  handleBasicInfoChange('ac', parseInt(e.target.value) || 0)
                }
                className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-center text-3xl font-bold focus-visible:ring-2"
              />
              <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
                Classe Armadura
              </span>
            </div>
          </Card>

          <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
            <div className="z-10 flex flex-col items-center">
              <Heart className="mb-2 h-6 w-6 text-red-500 drop-shadow-md" />
              <div className="flex items-baseline justify-center gap-1">
                <Input
                  type="number"
                  value={character.hpCurrent}
                  onChange={(e) =>
                    handleBasicInfoChange(
                      'hpCurrent',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-right text-3xl font-bold focus-visible:ring-2"
                />
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  value={character.hpMax}
                  onChange={(e) =>
                    handleBasicInfoChange(
                      'hpMax',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="focus-visible:ring-primary text-muted-foreground h-10 w-12 border-transparent bg-transparent p-0 text-left text-xl font-bold focus-visible:ring-2"
                />
              </div>
              <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
                Pontos de Vida
              </span>
            </div>
          </Card>

          <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
            <div className="z-10 flex flex-col items-center">
              <Footprints className="mb-2 h-6 w-6 text-emerald-500 drop-shadow-md" />
              <div className="flex items-baseline justify-center gap-1">
                <Input
                  type="number"
                  value={character.speed || 30}
                  onChange={(e) =>
                    handleBasicInfoChange(
                      'speed',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-center text-3xl font-bold focus-visible:ring-2"
                />
                <span className="text-muted-foreground text-sm">ft</span>
              </div>
              <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
                Deslocamento
              </span>
            </div>
          </Card>

          <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
            <div className="z-10 flex flex-col items-center">
              <Swords className="mb-2 h-6 w-6 text-orange-500 drop-shadow-md" />
              <Input
                type="number"
                value={character.initiative}
                onChange={(e) =>
                  handleBasicInfoChange(
                    'initiative',
                    parseInt(e.target.value) || 0,
                  )
                }
                className="focus-visible:ring-primary text-foreground h-10 w-16 border-transparent bg-transparent p-0 text-center text-3xl font-bold focus-visible:ring-2"
              />
              <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
                Iniciativa
              </span>
            </div>
          </Card>

          <Card className="border-border bg-card relative flex flex-col items-center justify-center overflow-hidden py-4">
            <div className="z-10 flex flex-col items-center">
              <Eye className="mb-2 h-6 w-6 text-blue-500 drop-shadow-md" />
              <span className="text-foreground flex h-10 items-center justify-center text-3xl font-bold">
                {character.passivePerception ?? 10}
              </span>
              <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase">
                Percepção Passiva
              </span>
            </div>
          </Card>
        </div>

        {/* Magias Conhecidas (Se houver) */}
        {character.spells && character.spells.length > 0 && (
          <Card className="border-border bg-card shadow-md">
            <CardContent className="p-4">
              <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                <BookOpen size={16} className="text-primary" />
                Magias Preparadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {character.spells.map((spellIndex) => (
                  <div
                    key={spellIndex}
                    className="bg-secondary text-secondary-foreground border-border flex items-center gap-2 rounded-full border"
                  >
                    <span className="capitalize">
                      {spellIndex.replace(/-/g, ' ')}
                    </span>
                    <button
                      onClick={() => handleForgetSpell(spellIndex)}
                      className="text-muted-foreground transition-colors hover:text-red-400"
                      title="Esquecer magia"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Grid: Attr on Left, Rest on Right */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <AttributesSection
              attributes={character.attributes}
              onAttributeChange={handleAttributeChange}
            />
          </div>

          <div className="flex flex-col gap-6 md:col-span-9">
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

            <div className="mt-4">
              <PassivePerception
                wisValue={character.attributes.WIS ?? 10}
                level={character.level}
                perceptionSkillData={character.skills?.PERCEPTION}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Extensível de Magias */}
      <SpellsDrawer
        isOpen={isSpellsOpen}
        onClose={() => setIsSpellsOpen(false)}
        learnedSpells={character?.spells || []}
        onLearnSpell={handleLearnSpell}
        onForgetSpell={handleForgetSpell}
      />
    </div>
  );
}
