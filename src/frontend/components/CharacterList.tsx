'use client';

import Link from 'next/link';

import { useCurrentUser } from '@/frontend/context/UserContext';
import { useCharacters } from '@/frontend/hooks/useCharacters';

interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  characterClass?: string;
  race?: string;
}

export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const { characters, isLoading, error } = useCharacters(currentUser);

  if (!currentUser) return null;

  if (error) {
    return (
      <div className="text-destructive p-6 text-center">
        <p>Erro ao carregar personagens: {error.message}</p>
      </div>
    );
  }

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="text-muted-foreground p-6 text-center">
        <p>Carregando personagens...</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border p-6 text-center">
        <p>Nenhum personagem ainda.</p>
        <Link
          href="/characters/new"
          className="text-foreground mt-3 inline-block text-sm font-medium hover:underline"
        >
          Criar primeiro personagem
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Personagens</h2>
        <Link
          href="/characters/new"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          + Novo
        </Link>
      </div>
      <ul className="divide-border divide-y">
        {characters.map((c) => (
          <li key={c.id}>
            <Link
              href={`/characters/${c.id}`}
              className="hover:bg-muted -mx-2 block rounded px-2 py-3"
            >
              <span className="text-foreground font-medium">{c.name}</span>
              <span className="text-muted-foreground ml-2 text-sm">
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
