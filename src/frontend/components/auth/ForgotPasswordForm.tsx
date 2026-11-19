'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

import { requestPasswordResetAction } from '@frontend/actions/auth/request-password-reset-action';
import { AuthSuccessCard } from '@frontend/components/auth/AuthSuccessCard';
import { authErrorCodeOf } from '@frontend/components/auth/auth-error-code';
import { TurnstileWidget, useTurnstile } from '@frontend/components/security/TurnstileWidget';
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

export default function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword');
  const tRegister = useTranslations('register');
  const tCommon = useTranslations('common');
  const { getMessage } = useErrorMessage();
  const [isSuccess, setIsSuccess] = useState(false);
  // Back from the success card, the e-mail field takes the focus (the button that was clicked is gone)
  const focusEmail = useRef(false);
  const {
    token: turnstileToken,
    setToken: setTurnstileToken,
    resetKey: turnstileKey,
    reset: resetTurnstile,
  } = useTurnstile();

  const schema = z.object({
    email: z.email(tRegister('errors.invalidEmail')),
  });

  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (!focusEmail.current || isSuccess) return;
    focusEmail.current = false;
    form.setFocus('email', { shouldSelect: true });
  }, [isSuccess, form]);

  const tryAnotherEmail = () => {
    // The challenge was spent on the request already sent
    resetTurnstile();
    focusEmail.current = true;
    setIsSuccess(false);
  };

  const onSubmit = async (data: Values) => {
    if (!turnstileToken) {
      form.setError('root', { message: getMessage('security_token_missing') });
      return;
    }

    try {
      const result = await requestPasswordResetAction(data.email, turnstileToken);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setServerError(form.setError, ['email'], result.error, getMessage(result.error));
        resetTurnstile();
      }
    } catch (err: unknown) {
      form.setError('root', { message: getMessage(authErrorCodeOf(err)) });
      resetTurnstile();
    }
  };

  if (isSuccess) {
    return (
      <AuthSuccessCard
        title={t('successTitle')}
        description={t.rich('successDescription', {
          email: form.getValues('email'),
          bold: (chunks) => <strong className="text-foreground">{chunks}</strong>,
        })}
      >
        <Button variant="outline" className="w-full" onClick={tryAnotherEmail}>
          {tCommon('useAnotherEmail')}
        </Button>
        <Button variant="ghost" asChild className="w-full">
          <Link href="/login">{t('backToLogin')}</Link>
        </Button>
      </AuthSuccessCard>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      autoComplete="email"
                      spellCheck={false}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TurnstileWidget key={turnstileKey} onTokenChange={setTurnstileToken} />

            <FormRootError />
            {/* Waits for the security check: a click before it passes would only get an error */}
            <Button
              type="submit"
              disabled={!turnstileToken}
              loading={form.formState.isSubmitting}
              className="mt-2 w-full font-semibold"
            >
              {form.formState.isSubmitting ? t('processing') : t('submit')}
            </Button>
            <div className="text-muted-foreground mt-2 text-center text-sm">
              <Link
                href="/login"
                className="text-primary-flare focus-ring rounded-sm hover:underline"
              >
                {t('backToLogin')}
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
