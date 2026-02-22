'use client';

import CharacterList from '@/frontend/components/CharacterList';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function CharactersPage() {
  const { currentUser } = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para ver seus personagens.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <CharacterList />
    </div>
  );
}
