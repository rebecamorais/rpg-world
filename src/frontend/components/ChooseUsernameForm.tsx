'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

import { Button } from '@frontend/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useProfile } from '@frontend/hooks/useProfile';
import { errorCodeOf } from '@frontend/lib/error-message';

import { safeRedirectPath } from '@backend/shared/infrastructure/helpers/safe-redirect-path';

import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_PATTERN,
} from '@shared/auth/username-policy';

/** Server answers about the username itself: shown under the field, the rest above the button. */
const USERNAME_ERRORS = new Set(['profile_error_username_taken', 'profile_error_username_invalid']);

/**
 * Asks for a username before the app is used. Starts empty: the generated placeholder is never
 * shown. Saving marks it as chosen; then the page the person was going to (`?next=`) opens.
 */
export default function ChooseUsernameForm() {
  const t = useTranslations('chooseUsername');
  const tValidation = useTranslations('profileForm.validation');
  const { getErrorMessage } = useErrorMessage();
  const { updateProfile, isUpdating } = useProfile();

  const schema = z.object({
    username: z
      .string()
      .check(
        z.minLength(MIN_USERNAME_LENGTH, tValidation('usernameMin')),
        z.maxLength(MAX_USERNAME_LENGTH, tValidation('usernameMax')),
        z.regex(USERNAME_PATTERN, tValidation('usernamePattern')),
      ),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: '' },
  });

  const onSubmit = async ({ username }: z.infer<typeof schema>) => {
    try {
      await updateProfile({ username });
      // Where the person was going when the dashboard asked for a username (same-site only)
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.assign(safeRedirectPath(next, window.location.origin, '/characters'));
    } catch (error) {
      const message = getErrorMessage(error);
      if (USERNAME_ERRORS.has(errorCodeOf(error) ?? '')) {
        form.setError('username', { message }, { shouldFocus: true });
      } else {
        form.setError('root', { message });
      }
    }
  };

  const saving = isUpdating || form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('label')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  // Usernames are lowercase: phones would otherwise capitalize and "correct" them
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder={t('placeholder')}
                  {...field}
                  // "Aria" becomes "aria" as it is typed: the rule only stops spaces and symbols
                  onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                />
              </FormControl>
              <FormDescription>{t('rules')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormRootError />
        <Button type="submit" loading={saving}>
          {saving ? t('saving') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
