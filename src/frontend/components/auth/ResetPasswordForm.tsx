'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { setServerError } from '@frontend/lib/form-errors';
import { newPasswordSchema } from '@frontend/lib/password-schema';

import { getSupabaseBrowserClient } from '@lib/supabase-browser';

// Supabase Auth error codes → our i18n error codes (same mapping as the backend auth repository)
const PASSWORD_ERROR_CODES: Record<string, string> = {
  weak_password: 'auth_error_update_password_weak',
  same_password: 'auth_error_update_password_same',
  over_request_rate_limit: 'auth_error_rate_limited',
};

export default function ResetPasswordForm() {
  const t = useTranslations('resetPassword');
  const tCommon = useTranslations('common');
  const { getMessage } = useErrorMessage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const handleSession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      // The recovery e-mail goes through /api/auth/confirm, which starts the session on the server.
      // Session tokens in the URL hash are deliberately not accepted: any page could put its own
      // there and log the visitor into that account.
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      setIsInitializing(false);
    };

    handleSession();

    // Also listen for changes (the session can arrive a moment after the page loads)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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

      if (!session) {
        form.setError('root', { message: t('sessionNotFound') });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        const code = PASSWORD_ERROR_CODES[error.code ?? ''];
        setServerError(form.setError, ['password'], code, getMessage(code));
      } else {
        setIsSuccess(true);
        toast.success(t('successTitle'));
      }
    } catch {
      form.setError('root', { message: getMessage(null) });
    }
  };

  if (isInitializing) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
        <CardContent className="text-muted-foreground pt-6 text-center">
          <div className="border-primary-flare mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          {t('processing')}...
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle as="h1">{t('successTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('successDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">{t('login')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle as="h1">{t('title')}</CardTitle>
        <CardDescription className="text-muted-foreground">{t('subtitle')}</CardDescription>
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
                      className="bg-muted/50"
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
                      className="bg-muted/50"
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
  );
}
