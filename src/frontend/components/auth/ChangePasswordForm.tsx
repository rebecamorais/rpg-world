'use client';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

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
  FormRootError,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { useAuth } from '@frontend/hooks/useAuth';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { errorCodeOf } from '@frontend/lib/error-message';
import { setServerError } from '@frontend/lib/form-errors';
import { newPasswordFields, passwordsMustMatch } from '@frontend/lib/password-schema';

interface ChangePasswordFormProps {
  /** An account with a password confirms it first; one without (Google only) just picks one. */
  hasPassword: boolean;
}

/**
 * Changes the password of the signed-in account. Success reloads the profile, which says so
 * (`?passwordChanged=1`): a toast here would be lost with the reload.
 */
export default function ChangePasswordForm({ hasPassword }: ChangePasswordFormProps) {
  const t = useTranslations('changePassword');
  const commonT = useTranslations('common');
  const { updatePassword } = useAuth();
  const { getErrorMessage } = useErrorMessage();

  const changePasswordSchema = z
    .object({
      currentPassword: hasPassword
        ? z.string().check(z.minLength(1, t('currentPasswordRequired')))
        : z.string(),
      ...newPasswordFields(commonT),
    })
    .check(passwordsMustMatch(commonT));

  type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    try {
      await updatePassword(data.password, hasPassword ? data.currentPassword : undefined);
    } catch (err: unknown) {
      setServerError(
        form.setError,
        hasPassword ? ['currentPassword', 'password'] : ['password'],
        errorCodeOf(err),
        getErrorMessage(err),
      );
    }
  };

  return (
    <div className="relative flex flex-1 items-center justify-center p-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/settings/profile"
          className="text-muted-foreground hover:text-foreground focus-ring rounded-sm text-sm transition-colors"
        >
          {t('backToProfile')}
        </Link>
      </div>

      <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle as="h1">{t('title')}</CardTitle>
          <CardDescription className="text-muted-foreground">{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {hasPassword && (
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('currentPasswordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-caption text-muted-foreground">
                        {t('forgotHint')}{' '}
                        <Link
                          href="/forgot-password"
                          className="text-primary-flare focus-ring rounded-sm hover:underline"
                        >
                          {t('forgotLink')}
                        </Link>
                      </p>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('newPasswordPlaceholder')}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('confirmPasswordPlaceholder')}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormRootError />
              <Button
                type="submit"
                loading={form.formState.isSubmitting}
                className="mt-2 w-full font-semibold"
              >
                {form.formState.isSubmitting ? t('processing') : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
