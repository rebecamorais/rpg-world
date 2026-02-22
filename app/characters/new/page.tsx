'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/frontend/components/ui/form';
import { Input } from '@/frontend/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/components/ui/select';
import { useCurrentUser } from '@/frontend/context/UserContext';

const newCharacterSchema = z.object({
  name: z.string().min(1, 'Nome do personagem é obrigatório.'),
  system: z.string().min(1, 'Selecione um sistema RPG.'),
});

type NewCharacterFormValues = z.infer<typeof newCharacterSchema>;

export default function NewCharacterPage() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewCharacterFormValues>({
    resolver: zodResolver(newCharacterSchema),
    defaultValues: {
      name: '',
      system: 'DnD_5e',
    },
  });

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-zinc-500">Faça login para criar personagem.</p>
      </div>
    );
  }

  const onSubmit = async (data: NewCharacterFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          ownerUsername: currentUser.username,
          system: data.system,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao criar personagem.');
      }

      const { id } = await res.json();
      toast.success('Personagem criado com sucesso!');
      router.push(`/characters/${id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao criar personagem.';
      toast.error(msg);
      form.setError('root', { message: msg });
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="Nome do personagem"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema RPG</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o Sistema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DnD_5e">D&D 5ª Edição</SelectItem>
                        {/* Future systems will be added here */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.root.message}
                </p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar'}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/characters">Cancelar</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
