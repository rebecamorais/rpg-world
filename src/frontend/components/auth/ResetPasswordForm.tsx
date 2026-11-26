'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod/mini';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { NETWORK_ERROR } from '@frontend/lib/error-message';
import { setServerError } from '@frontend/lib/form-errors';
import { newPasswordSchema } from '@frontend/lib/password-schema';

import { MIN_PASSWORD_LENGTH } from '@shared/auth/password-policy';

import { getSupabaseBrowserClient } from '@lib/supabase-browser';

// Supabase Auth error codes → our i18n error codes (same mapping as the backend auth repository)
const PASSWORD_ERROR_CODES: Record<string, string> = {
  weak_password: 'auth_error_update_password_weak',
  same_password: 'auth_error_update_password_same',
  over_request_rate_limit: 'auth_error_rate_limited',
};

/** Supabase answers a request that never reached it with status 0 instead of throwing. */
function passwordErrorCode(error: { code?: string; status?: number }): string | undefined {
  return PASSWORD_ERROR_CODES[error.code ?? ''] ?? (error.status === 0 ? NETWORK_ERROR : undefined);
}

interface ResetPasswordFormProps {
  /** The account whose password changes, masked (`c***@email.com`). */
  email?: string;
}

/**
 * The new password after the recovery link. The page only shows it with the link's session, so the
 * person is already signed in: once saved, the app opens, with a toast that says it worked.
 */
export default function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const t = useTranslations('resetPassword');
  const tCommon = useTranslations('common');
  const { getMessage, getErrorMessage } = useErrorMessage();
  const router = useRouter();

  const supabase = getSupabaseBrowserClient();

  const schema = newPasswordSchema(tCommon);

  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: Values) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // The session can end while the form is open (the page checked it when it loaded)
      if (!session) {
        form.setError('root', { message: t('sessionNotFound') });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        const code = passwordErrorCode(error);
        setServerError(form.setError, ['password'], code, getMessage(code));
        return;
      }

      toast.success(t('changed'));
      router.replace('/characters');
    } catch (err: unknown) {
      form.setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle as="h1">{t('title')}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {email ? t('subtitleForEmail', { email }) : t('subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                  {/* The rule shows up front, as on sign-up, not only as an error after sending */}
                  <FormDescription>
                    {t('passwordHint', { min: MIN_PASSWORD_LENGTH })}
                  </FormDescription>
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
              loading={form.formState.isSubmitting || form.formState.isSubmitSuccessful}
              className="mt-2 w-full font-semibold"
            >
              {form.formState.isSubmitting ? t('processing') : t('submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
