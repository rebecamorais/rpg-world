'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useProfile } from '@frontend/hooks/useProfile';

/**
 * Asks for a username before the app is used. Starts empty: the generated placeholder is never
 * shown. Saving marks it as chosen; then the dashboard opens.
 */
export default function ChooseUsernameForm() {
  const t = useTranslations('chooseUsername');
  const tValidation = useTranslations('profileForm.validation');
  const { getMessage } = useErrorMessage();
  const { updateProfile, isUpdating } = useProfile();

  const schema = z.object({
    username: z
      .string()
      .check(
        z.minLength(3, tValidation('usernameMin')),
        z.maxLength(30, tValidation('usernameMax')),
        z.regex(/^[a-z0-9_]+$/, tValidation('usernamePattern')),
      ),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: '' },
  });

  const onSubmit = async ({ username }: z.infer<typeof schema>) => {
    try {
      await updateProfile({ username });
      window.location.assign('/characters');
    } catch (error) {
      form.setError('username', {
        message: getMessage(error instanceof Error ? error.message : 'unknown'),
      });
    }
  };

  const error = form.formState.errors.username?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="choose-username" className="text-sm font-medium">
          {t('label')}
        </label>
        <Input
          id="choose-username"
          autoComplete="username"
          placeholder={t('placeholder')}
          aria-invalid={!!error}
          aria-describedby={error ? 'choose-username-error' : undefined}
          {...form.register('username')}
        />
        {error && (
          <p id="choose-username-error" role="alert" className="text-danger-flare text-sm">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isUpdating}>
        {isUpdating ? t('saving') : t('submit')}
      </Button>
    </form>
  );
}
