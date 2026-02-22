'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/frontend/components/ui/button';
import {
  Card,
  CardContent,
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
import { useCurrentUser } from '@/frontend/context/UserContext';

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username é obrigatório.' }),
  displayName: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login } = useCurrentUser();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      displayName: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    try {
      const trimmedUsername = data.username.trim();
      const trimmedDisplayName = data.displayName?.trim();

      login(trimmedUsername, trimmedDisplayName || undefined);
      toast.success(`Bem-vindo, ${trimmedDisplayName || trimmedUsername}!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao realizar login.';
      toast.error(msg);
      form.setError('root', { message: msg });
    }
  };

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar no RPG World</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seu_id"
                      autoComplete="username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de exibição (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Como quer ser chamado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button type="submit">Entrar</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
