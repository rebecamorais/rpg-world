'use client';

import { useState } from 'react';

import { useCurrentUser } from '@/frontend/context/UserContext';

export default function LoginForm() {
  const { login } = useCurrentUser();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username é obrigatório.');
      return;
    }
    login(trimmed, displayName.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Entrar no RPG World
      </h2>
      <div>
        <label
          htmlFor="username"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Username *
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="seu_id"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          autoComplete="username"
        />
      </div>
      <div>
        <label
          htmlFor="displayName"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nome de exibição (opcional)
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Como quer ser chamado"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Entrar
      </button>
    </form>
  );
}
