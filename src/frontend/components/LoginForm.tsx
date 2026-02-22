'use client';

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
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
      toast.error('Username é obrigatório.');
      return;
    }

    try {
      login(trimmed, displayName.trim() || undefined);
      toast.success(`Bem-vindo, ${displayName.trim() || trimmed}!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao realizar login.';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar no RPG World</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      </CardContent>
    </Card>
  );
}
