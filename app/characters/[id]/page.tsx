'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useCurrentUser } from '@/frontend/context/UserContext';
import {
  getCharacterById,
  updateCharacter,
  deleteCharacter,
} from '@/backend/store/memory-store';
import { getProficiencyBonus } from '@/systems/dnd5e/calculations';
import type { AttributeKey, DnD5eCharacter } from '@/systems/dnd5e';
import AttributesSection from '@/frontend/components/AttributesSection';
import SkillsSection from '@/frontend/components/SkillsSection';
import SavingThrowsSection from '@/frontend/components/SavingThrowsSection';
import PassivePerception from '@/frontend/components/PassivePerception';
import {
  Shield,
  Heart,
  Footprints,
  Swords,
  Eye
} from 'lucide-react';
import type { SkillKey } from '@/systems/dnd5e/constants';
import type { CharacterSkill } from '@/systems/dnd5e/types';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Input } from '@/frontend/components/ui/input';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [error, setError] = useState('');

  const { currentUser } = useCurrentUser();
  const id = params?.id as string;

  const [character, setCharacter] = useState<DnD5eCharacter | null>(() =>
    id ? getCharacterById(id) ?? null : null
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para ver o personagem.</p>
      </div>
    );
  }

  if (!character || character.ownerUsername !== currentUser.username) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Personagem não encontrado.</p>
        <Link href="/characters" className="mt-2 block text-sm underline">
          Voltar à lista
        </Link>
      </div>
    );
  }


  const handleDelete = () => {
    if (confirm('Excluir este personagem? Não é possível desfazer.')) {
      const ok = deleteCharacter(character.id, currentUser.username);
      if (ok) router.push('/characters');
    }
  };

  const handleAttributeChange = (key: AttributeKey, value: number) => {
    if (!currentUser) return;
    try {
      setError('');
      const updated = updateCharacter(character.id, currentUser.username, {
        attributes: { ...character.attributes, [key]: value },
      });
      if (updated) setCharacter(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar atributo');
    }
  };

  const handleSkillChange = (key: SkillKey, skillData: CharacterSkill) => {
    if (!currentUser) return;
    try {
      setError('');
      const updated = updateCharacter(character.id, currentUser.username, {
        skills: { ...character.skills, [key]: skillData },
      });
      if (updated) setCharacter(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perícia');
    }
  };

  const handleSavingThrowChange = (key: AttributeKey, isProficient: boolean) => {
    if (!currentUser) return;
    try {
      setError('');
      const updated = updateCharacter(character.id, currentUser.username, {
        savingThrowProficiencies: { ...character.savingThrowProficiencies, [key]: isProficient },
      });
      if (updated) setCharacter(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar salvaguarda');
    }
  };

  const handleBasicInfoChange = (field: keyof DnD5eCharacter, value: string | number) => {
    if (!currentUser) return;
    try {
      setError('');
      const updated = updateCharacter(character.id, currentUser.username, {
        [field]: value,
      } as Partial<DnD5eCharacter>);
      if (updated) setCharacter(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar personagem');
    }
  };

  const pb = getProficiencyBonus(character.level);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <Link
          href="/characters"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          ← Voltar
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Excluir
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
      <div className="flex flex-col gap-6">
        {/* Header Block Editable */}
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 flex flex-col justify-end">
                <Input
                  value={character.name}
                  onChange={e => handleBasicInfoChange('name', e.target.value)}
                  className="text-3xl font-bold bg-transparent border-transparent px-0 h-auto rounded-none focus-visible:ring-0 focus-visible:border-b focus-visible:border-[#663399]"
                  placeholder="Nome do Personagem"
                />
              </div>
              <div className="md:col-span-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Classe</label>
                  <Input
                    value={character.class || ''}
                    onChange={e => handleBasicInfoChange('class', e.target.value)}
                    className="bg-transparent border-b border-zinc-800 px-1 py-0 h-7 rounded-none focus-visible:ring-0 focus-visible:border-[#663399]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nível</label>
                  <Input
                    type="number"
                    min={1}
                    value={character.level}
                    onChange={e => handleBasicInfoChange('level', parseInt(e.target.value) || 1)}
                    className="bg-transparent border-b border-zinc-800 px-1 py-0 h-7 rounded-none focus-visible:ring-0 focus-visible:border-[#663399]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Raça</label>
                  <Input
                    value={character.race || ''}
                    onChange={e => handleBasicInfoChange('race', e.target.value)}
                    className="bg-transparent border-b border-zinc-800 px-1 py-0 h-7 rounded-none focus-visible:ring-0 focus-visible:border-[#663399]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combat Stats Block (Lucide Icons) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative group">
            <Shield className="absolute text-[#663399]/10 w-24 h-24" />
            <div className="z-10 flex flex-col items-center">
              <Shield className="text-[#663399] w-6 h-6 mb-2" />
              <Input
                type="number"
                value={character.ac}
                onChange={e => handleBasicInfoChange('ac', parseInt(e.target.value) || 0)}
                className="text-3xl font-bold text-center w-16 h-10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-[#663399] text-zinc-100 p-0"
              />
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Classe Armadura</span>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative">
            <Heart className="absolute text-red-500/10 w-24 h-24" />
            <div className="z-10 flex flex-col items-center">
              <Heart className="text-red-500 w-6 h-6 mb-2" />
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

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative">
            <Footprints className="absolute text-purple-400/5 w-24 h-24" />
            <div className="z-10 flex flex-col items-center">
              <Footprints className="text-purple-400 w-6 h-6 mb-2" />
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

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative">
            <Swords className="absolute text-purple-400/5 w-24 h-24" />
            <div className="z-10 flex flex-col items-center">
              <Swords className="text-purple-400 w-6 h-6 mb-2" />
              <Input
                type="number"
                value={character.initiative}
                onChange={e => handleBasicInfoChange('initiative', parseInt(e.target.value) || 0)}
                className="text-3xl font-bold text-center w-16 h-10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-[#663399] text-zinc-100 p-0"
              />
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Iniciativa</span>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 border-zinc-800 relative">
            <Eye className="absolute text-purple-400/5 w-24 h-24" />
            <div className="z-10 flex flex-col items-center">
              <Eye className="text-purple-400 w-6 h-6 mb-2" />
              <span className="text-3xl font-bold text-zinc-100 h-10 flex items-center justify-center">
                {(character.attributes.WIS ? Math.floor((character.attributes.WIS - 10) / 2) : 0) + 10 + (character.skills?.PERCEPTION?.isProficient ? pb : 0)}
              </span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Percepção Passiva</span>
            </div>
          </Card>
        </div>
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
    </div>
  );
}
