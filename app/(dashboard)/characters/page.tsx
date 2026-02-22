'use client';

import CharacterList from '@/frontend/components/CharacterList';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function CharactersPage() {
  const { currentUser } = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">
          Faça login para ver seus personagens.
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4">
      <CharacterList />
    </main>
  );
}
