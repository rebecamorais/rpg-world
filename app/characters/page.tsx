'use client';

import { useCurrentUser } from '@/context/UserContext';
import CharacterList from '@/components/CharacterList';

export default function CharactersPage() {
  const { currentUser } = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para ver seus personagens.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <CharacterList />
    </div>
  );
}
