'use client';

import CharacterList from '@/frontend/components/CharacterList';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function CharactersPage() {
  const { currentUser, logout } = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">
          Faça login para ver seus personagens.
        </p>
      </div>
    );
  }

  const displayLabel = currentUser.displayName || currentUser.username;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-card flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">RPG World</h1>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline-block">
            {displayLabel}{' '}
            <span className="opacity-70">(@{currentUser.username})</span>
          </span>
          <button
            type="button"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <CharacterList />
      </main>
    </div>
  );
}
