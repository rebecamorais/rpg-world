'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function NewCharacterPage() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [class_, setClass_] = useState('');
  const [level, setLevel] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para criar personagem.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nome do personagem é obrigatório.');
      return;
    }

    const levelNum = Math.max(1, Math.floor(Number(level)) || 1);

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          ownerUsername: currentUser.username,
          system: 'DnD_5e',
          class: class_.trim(),
          race: race.trim(),
          level: levelNum
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar personagem.');
      }

      const { id } = await res.json();
      router.push(`/characters/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar personagem.');
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Criando...' : 'Criar'}
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
