'use client';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useCreateCharacter } from '@frontend/hooks/useCreateCharacter';

export default function NewCharacterForm() {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('characterCreation');
  const tCommon = useTranslations('common');
  const createMutation = useCreateCharacter(t('success'), t('error'));

  const newCharacterSchema = z.object({
    name: z.string().min(1, t('nameLabel').replace(' *', '')),
    system: z.string().min(1, t('systemPlaceholder')),
  });

  type NewCharacterFormValues = z.infer<typeof newCharacterSchema>;

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
        <p className="text-zinc-500">{t('requireLogin')}</p>
      </div>
    );
  }

  const onSubmit = (data: NewCharacterFormValues) => {
    createMutation.mutate(
      {
        name: data.name.trim(),
        system: data.system,
        ownerUsername: currentUser.id,
      },
      {
        onError: (err: Error) => {
          form.setError('root', { message: err.message });
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4">
        <Link
          href="/characters"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {tCommon('back')}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={createMutation.isPending}
                        placeholder={t('namePlaceholder')}
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
                    <FormLabel>{t('systemLabel')}</FormLabel>
                    <Select
                      disabled={createMutation.isPending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('systemPlaceholder')} />
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t('submitting') : t('submit')}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/characters">{tCommon('cancel')}</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
