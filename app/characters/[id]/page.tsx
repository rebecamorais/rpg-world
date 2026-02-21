'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/context/UserContext';
import {
  getCharacterById,
  updateCharacter,
  deleteCharacter,
} from '@/store/memory-store';
import { getProficiencyBonus } from '@/systems/dnd5e/calculations';
import type { AttributeKey, DnD5eCharacter } from '@/systems/dnd5e';
import AttributesSection from '@/components/AttributesSection';
import SkillsSection from '@/components/SkillsSection';
import SavingThrowsSection from '@/components/SavingThrowsSection';
import PassivePerception from '@/components/PassivePerception';
import type { SkillKey } from '@/systems/dnd5e/constants';
import type { CharacterSkill } from '@/systems/dnd5e/types';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const id = params?.id as string;
  const [character, setCharacter] = useState<DnD5eCharacter | null>(() =>
    id ? getCharacterById(id) ?? null : null
  );

  useEffect(() => {
    const c = id ? getCharacterById(id) : null;
    setCharacter(c ?? null);
  }, [id]);

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

  const [error, setError] = useState('');

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
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar atributo');
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
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perícia');
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
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar salvaguarda');
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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        {character.name}
      </h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-zinc-500 dark:text-zinc-400">Nível</dt>
        <dd>{character.level}</dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Raça</dt>
        <dd>{character.race || '—'}</dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Classe</dt>
        <dd>{character.class || '—'}</dd>
        <dt className="text-zinc-500 dark:text-zinc-400">PV</dt>
        <dd>
          {character.hpCurrent} / {character.hpMax}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">CA</dt>
        <dd>{character.ac}</dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Iniciativa</dt>
        <dd>{character.initiative}</dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Bônus de proficiência</dt>
        <dd>{pb >= 0 ? `+${pb}` : pb}</dd>
      </dl>
      <div className="mt-6">
        <AttributesSection
          attributes={character.attributes}
          onAttributeChange={handleAttributeChange}
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
        <div className="mt-8">
          <PassivePerception
            wisValue={character.attributes.WIS ?? 10}
            level={character.level}
            perceptionSkillData={character.skills?.PERCEPTION}
          />
        </div>
      </div>
    </div>
  );
}
