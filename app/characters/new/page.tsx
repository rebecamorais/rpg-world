'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/context/UserContext';
import { addCharacter } from '@/store/memory-store';
import { createDnD5eCharacter } from '@/systems/dnd5e/factory';

export default function NewCharacterPage() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [class_, setClass_] = useState('');
  const [level, setLevel] = useState(1);
  const [error, setError] = useState('');

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para criar personagem.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nome do personagem é obrigatório.');
      return;
    }
    const levelNum = Math.max(1, Math.floor(Number(level)) || 1);
    const base = createDnD5eCharacter(currentUser.username, trimmedName, {
      race: race.trim(),
      class: class_.trim(),
      level: levelNum,
      hpMax: levelNum * 8,
      hpCurrent: levelNum * 8,
    });
    const id = crypto.randomUUID();
    const character = addCharacter({
      ...base,
      id,
    });
    router.push(`/characters/${character.id}`);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="mb-4">
        <Link
          href="/characters"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          ← Voltar
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Novo personagem
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nome *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="race" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Raça
          </label>
          <input
            id="race"
            type="text"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="class" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Classe
          </label>
          <input
            id="class"
            type="text"
            value={class_}
            onChange={(e) => setClass_(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nível
          </label>
          <input
            id="level"
            type="number"
            min={1}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium"
          >
            Criar
          </button>
          <Link
            href="/characters"
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
