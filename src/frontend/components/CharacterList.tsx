'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/frontend/context/UserContext';
import { getCharactersByOwner } from '@/backend/store/memory-store';

export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const characters = currentUser
    ? getCharactersByOwner(currentUser.username)
    : [];

  if (!currentUser) return null;

  if (characters.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 text-center text-zinc-500 dark:text-zinc-400">
        <p>Nenhum personagem ainda.</p>
        <Link
          href="/characters/new"
          className="mt-3 inline-block text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Criar primeiro personagem
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Personagens
        </h2>
        <Link
          href="/characters/new"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          + Novo
        </Link>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {characters.map((c) => (
          <li key={c.id}>
            <Link
              href={`/characters/${c.id}`}
              className="block py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded px-2 -mx-2"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {c.name}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm ml-2">
                Nível {c.level}
                {c.class ? ` · ${c.class}` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
