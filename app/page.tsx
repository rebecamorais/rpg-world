'use client';

import { useCurrentUser } from '@/context/UserContext';
import LoginForm from '@/components/LoginForm';
import CharacterList from '@/components/CharacterList';

export default function Home() {
  const { currentUser, logout } = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <LoginForm />
      </div>
    );
  }

  const displayLabel = currentUser.displayName || currentUser.username;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          RPG World
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {displayLabel} <span className="text-zinc-400">(@{currentUser.username})</span>
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
      <main className="max-w-3xl mx-auto p-4">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Olá, {displayLabel}.
        </p>
        <CharacterList />
      </main>
    </div>
  );
}
