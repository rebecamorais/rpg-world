'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/frontend/context/UserContext';

export default function NewCharacterPage() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [system, setSystem] = useState('DnD_5e');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
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

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          ownerUsername: currentUser.username,
          system: system,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar personagem.');
      }

      const { id } = await res.json();
      router.push(`/characters/${id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Erro ao criar personagem.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4">
        <Link
          href="/characters"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          ← Voltar
        </Link>
      </div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Novo personagem
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Nome *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="system"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Sistema RPG
          </label>
          <select
            id="system"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            disabled={isSubmitting}
          >
            <option value="DnD_5e">D&D 5ª Edição</option>
            {/* Future systems will be added here */}
          </select>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isSubmitting ? 'Criando...' : 'Criar'}
          </button>
          <Link
            href="/characters"
            className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
