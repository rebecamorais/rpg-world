'use client';

import CharacterList from '@/frontend/components/CharacterList';
import LoginForm from '@/frontend/components/LoginForm';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function Home() {
  const { currentUser, logout } = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <LoginForm />
      </div>
    );
  }

  const displayLabel = currentUser.displayName || currentUser.username;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          RPG World
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {displayLabel}{' '}
            <span className="text-zinc-400">(@{currentUser.username})</span>
          </span>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          Olá, {displayLabel}.
        </p>
        <CharacterList />
      </main>
    </div>
  );
}
