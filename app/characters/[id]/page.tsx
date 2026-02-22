'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/frontend/context/UserContext';
import { getProficiencyBonus } from '@/systems/dnd5e/calculations';
import type { AttributeKey, DnD5eCharacter } from '@/systems/dnd5e';
import AttributesSection from '@/frontend/components/AttributesSection';
import SkillsSection from '@/frontend/components/SkillsSection';
import SavingThrowsSection from '@/frontend/components/SavingThrowsSection';
import PassivePerception from '@/frontend/components/PassivePerception';
import SpellsDrawer from '@/frontend/components/SpellsDrawer';
import {
  Shield,
  Heart,
  Footprints,
  Swords,
  Eye,
  BookOpen
} from 'lucide-react';
import type { SkillKey } from '@/systems/dnd5e/constants';
import type { CharacterSkill } from '@/systems/dnd5e/types';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Input } from '@/frontend/components/ui/input';

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
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setCharacter(data as DnD5eCharacter);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id, currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para ver o personagem.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Carregando...</p>
      </div>
    );
  }

  if (!character || character.ownerUsername !== currentUser.username) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Personagem não encontrado ou você não tem permissão.</p>
        <Link href="/characters" className="mt-2 block text-sm underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Excluir este personagem? Não é possível desfazer.')) {
      try {
        const res = await fetch(`/api/characters/${character.id}?ownerUsername=${encodeURIComponent(currentUser.username)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          router.push('/characters');
        } else {
          const data = await res.json();
          setError(data.error || 'Erro ao deletar personagem.');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao deletar personagem');
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
          updates: character // We send the whole character state buffered in React
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao salvar no servidor.');
      }
      setHasUnsavedChanges(false);
      alert('Personagem salvo com sucesso!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar no servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttributeChange = (key: AttributeKey, value: number) => {
    setError('');
    setCharacter(prev => prev ? { ...prev, attributes: { ...prev.attributes, [key]: value } as Record<AttributeKey, number> } as DnD5eCharacter : null);
    setHasUnsavedChanges(true);
  };

  const handleSkillChange = (key: SkillKey, skillData: CharacterSkill) => {
    setError('');
    setCharacter(prev => prev ? { ...prev, skills: { ...prev.skills, [key]: skillData } } as DnD5eCharacter : null);
    setHasUnsavedChanges(true);
  };

  const handleSavingThrowChange = (key: AttributeKey, isProficient: boolean) => {
    setError('');
    setCharacter(prev => prev ? { ...prev, savingThrowProficiencies: { ...prev.savingThrowProficiencies, [key]: isProficient } as Record<AttributeKey, boolean> } as DnD5eCharacter : null);
    setHasUnsavedChanges(true);
  };

  const handleBasicInfoChange = (field: keyof DnD5eCharacter, value: string | number) => {
    setError('');
    setCharacter(prev => prev ? { ...prev, [field]: value } as DnD5eCharacter : null);
    setHasUnsavedChanges(true);
  };

  const handleLearnSpell = (spellIndex: string) => {
    const currentSpells = character.spells || [];
    if (!currentSpells.includes(spellIndex)) {
      setCharacter(prev => prev ? { ...prev, spells: [...currentSpells, spellIndex] } as DnD5eCharacter : null);
      setHasUnsavedChanges(true);
    }
  };

  const handleForgetSpell = (spellIndex: string) => {
    const currentSpells = character.spells || [];
    setCharacter(prev => prev ? { ...prev, spells: currentSpells.filter(s => s !== spellIndex) } as DnD5eCharacter : null);
    setHasUnsavedChanges(true);
  };

  const pb = getProficiencyBonus(character.level);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/characters"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            ← Voltar
          </Link>
          {hasUnsavedChanges && (
            <span className="text-xs font-semibold px-2 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">
              Alterações não salvas
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={updateCharacterInBackend}
            disabled={!hasUnsavedChanges || isSaving}
            className="text-sm px-4 py-2 bg-[#663399] text-white rounded font-medium disabled:opacity-50 transition-opacity"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Excluir
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
      <div className="flex flex-col gap-6">

        {/* Header Block Editable */}
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-6 md:w-2/3 flex flex-col justify-end border-b md:border-b-0 md:border-r border-zinc-800">
              <Input
                value={character.name}
                onChange={e => handleBasicInfoChange('name', e.target.value)}
                className="text-3xl font-bold bg-transparent border-transparent px-0 h-auto rounded-none focus-visible:ring-0 focus-visible:border-b focus-visible:border-[#663399]"
                placeholder="Nome do Personagem"
              />
              <div className="flex gap-4 mt-2">
                <div className="text-sm text-zinc-400">
                  Bônus de Proficiência: <span className="font-bold text-[#663399]">+{pb}</span>
                </div>
              </div>
            </div>
            <div className="p-6 md:w-1/3 grid grid-cols-2 gap-4 bg-black/20">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Classe</label>
                <Input
                  value={character.class || ''}
                  onChange={e => handleBasicInfoChange('class', e.target.value)}
                  className="bg-transparent border-b border-zinc-800 px-1 py-0 h-7 rounded-none focus-visible:ring-0 focus-visible:border-[#663399] text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nível</label>
                <Input
                  type="number"
                  min={1}
                  value={character.level}
                  onChange={e => handleBasicInfoChange('level', parseInt(e.target.value) || 1)}
                  className="bg-transparent border-b border-zinc-800 px-1 py-0 h-7 rounded-none focus-visible:ring-0 focus-visible:border-[#663399] text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Raça</label>
                <Input
                  value={character.race || ''}
                  onChange={e => handleBasicInfoChange('race', e.target.value)}
                  className="bg-transparent border-b border-zinc-800 px-1 py-0 h-7 rounded-none focus-visible:ring-0 focus-visible:border-[#663399] text-sm"
                />
              </div>
              <div className="col-span-2 mt-2">
                <button
                  onClick={() => setIsSpellsOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#663399]/10 hover:bg-[#663399]/20 text-[#be8be8] text-xs font-semibold rounded border border-[#663399]/30 transition-colors"
                >
                  <BookOpen size={14} />
                  Grimório de Magias
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combat Stats Block (Lucide Icons) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative group overflow-hidden bg-[#1a1a1a]">
            <div className="z-10 flex flex-col items-center">
              <Shield className="text-[#663399] w-6 h-6 mb-2 drop-shadow-md" />
              <Input
                type="number"
                value={character.ac}
                onChange={e => handleBasicInfoChange('ac', parseInt(e.target.value) || 0)}
                className="text-3xl font-bold text-center w-16 h-10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-[#663399] text-zinc-100 p-0"
              />
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Classe Armadura</span>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative overflow-hidden bg-[#1a1a1a]">
            <div className="z-10 flex flex-col items-center">
              <Heart className="text-red-500 w-6 h-6 mb-2 drop-shadow-md" />
              <div className="flex items-baseline justify-center gap-1">
                <Input
                  type="number"
                  value={character.hpCurrent}
                  onChange={e => handleBasicInfoChange('hpCurrent', parseInt(e.target.value) || 0)}
                  className="text-3xl font-bold text-right w-16 h-10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-[#663399] text-zinc-100 p-0"
                />
                <span className="text-zinc-500">/</span>
                <Input
                  type="number"
                  value={character.hpMax}
                  onChange={e => handleBasicInfoChange('hpMax', parseInt(e.target.value) || 0)}
                  className="text-xl font-bold text-left w-12 h-10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-[#663399] text-zinc-500 p-0"
                />
              </div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Pontos de Vida</span>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative overflow-hidden bg-[#1a1a1a]">
            <div className="z-10 flex flex-col items-center">
              <Footprints className="text-emerald-500 w-6 h-6 mb-2 drop-shadow-md" />
              <div className="flex items-baseline justify-center gap-1">
                <Input
                  type="number"
                  value={character.speed || 30}
                  onChange={e => handleBasicInfoChange('speed', parseInt(e.target.value) || 0)}
                  className="text-3xl font-bold text-center w-16 h-10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-[#663399] text-zinc-100 p-0"
                />
                <span className="text-sm text-zinc-500">ft</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Deslocamento</span>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative overflow-hidden bg-[#1a1a1a]">
            <div className="z-10 flex flex-col items-center">
              <Swords className="text-orange-500 w-6 h-6 mb-2 drop-shadow-md" />
              <Input
                type="number"
                value={character.initiative}
                onChange={e => handleBasicInfoChange('initiative', parseInt(e.target.value) || 0)}
                className="text-3xl font-bold text-center w-16 h-10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-[#663399] text-zinc-100 p-0"
              />
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Iniciativa</span>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative overflow-hidden bg-[#1a1a1a]">
            <div className="z-10 flex flex-col items-center">
              <Eye className="text-blue-500 w-6 h-6 mb-2 drop-shadow-md" />
              <span className="text-3xl font-bold text-zinc-100 h-10 flex items-center justify-center">
                {(character.attributes.WIS ? Math.floor((character.attributes.WIS - 10) / 2) : 0) + 10 + (character.skills?.PERCEPTION?.isProficient ? pb : 0)}
              </span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Percepção Passiva</span>
            </div>
          </Card>
        </div>

        {/* Magias Conhecidas (Se houver) */}
        {character.spells && character.spells.length > 0 && (
          <Card className="bg-[#1a1a1a] border-zinc-800 shadow-md">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-[#663399]" />
                Magias Preparadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {character.spells.map(spellIndex => (
                  <div key={spellIndex} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-zinc-700">
                    <span className="capitalize">{spellIndex.replace(/-/g, ' ')}</span>
                    <button
                      onClick={() => handleForgetSpell(spellIndex)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            <AttributesSection
              attributes={character.attributes}
              onAttributeChange={handleAttributeChange}
            />
          </div>

          <div className="md:col-span-9 flex flex-col gap-6">
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
