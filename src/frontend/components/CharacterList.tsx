'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useCurrentUser } from '@/frontend/context/UserContext';

interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  characterClass?: string;
  race?: string;
}

export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(!!currentUser);

  useEffect(() => {
    if (!currentUser) return;

    fetch(
      `/api/characters?ownerUsername=${encodeURIComponent(currentUser.username)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCharacters(data);
        }
      })
      .catch((err) => console.error('Failed to fetch characters', err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="p-6 text-center text-zinc-500">
        <p>Carregando personagens...</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 p-6 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <p>Nenhum personagem ainda.</p>
        <Link
          href="/characters/new"
          className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          Criar primeiro personagem
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Personagens
        </h2>
        <Link
          href="/characters/new"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          + Novo
        </Link>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {characters.map((c) => (
          <li key={c.id}>
            <Link
              href={`/characters/${c.id}`}
              className="-mx-2 block rounded px-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {c.name}
              </span>
              <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                Nível {c.level}
                {c.characterClass ? ` · ${c.characterClass}` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
