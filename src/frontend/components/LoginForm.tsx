'use client';

import { useState } from 'react';

import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
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
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="seu_id"
          autoComplete="username"
        />
      </div>
      <div>
        <Label htmlFor="displayName">Nome de exibição (opcional)</Label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Como quer ser chamado"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit">Entrar</Button>
    </form>
  );
}
