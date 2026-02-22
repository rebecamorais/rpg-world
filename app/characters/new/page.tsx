'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import { SingleSelect } from '@/frontend/components/ui/single-select';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function NewCharacterPage() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [system, setSystem] = useState('DnD_5e');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para criar personagem.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nome do personagem é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          ownerUsername: currentUser.username,
          system: system,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar personagem.');
      }

      const { id } = await res.json();
      toast.success('Personagem criado com sucesso!');
      router.push(`/characters/${id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao criar personagem.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4">
        <Link
          href="/characters"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          ← Voltar
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Novo personagem</CardTitle>
          <CardDescription>
            Defina o nome e escolha o sistema de regras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="system">Sistema RPG</Label>
              <SingleSelect
                id="system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="DnD_5e">D&D 5ª Edição</option>
                {/* Future systems will be added here */}
              </SingleSelect>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar'}
              </Button>
              <Link
                href="/characters"
                className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-600"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
