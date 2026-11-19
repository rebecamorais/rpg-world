'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

import { signUpAction } from '@frontend/actions/auth/sign-up-action';
import { AuthSuccessCard } from '@frontend/components/auth/AuthSuccessCard';
import { GoogleSignIn } from '@frontend/components/auth/GoogleSignIn';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { setServerError } from '@frontend/lib/form-errors';
import { newPasswordFields, passwordsMustMatch } from '@frontend/lib/password-schema';
import { rememberNext } from '@frontend/lib/post-login-next';

import { MIN_PASSWORD_LENGTH } from '@shared/auth/password-policy';

export default function SignUpForm() {
  // Kept through the e-mail confirmation: the person lands back on the link they opened
  useEffect(rememberNext, []);
  const t = useTranslations('register');
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

  const signUpSchema = z
    .object({
      email: z.email(t('errors.invalidEmail')),
      ...newPasswordFields(tCommon),
    })
    .check(passwordsMustMatch(tCommon));

  type SignUpValues = z.infer<typeof signUpSchema>;

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!focusEmail.current || isSuccess) return;
    focusEmail.current = false;
    form.setFocus('email', { shouldSelect: true });
  }, [isSuccess, form]);

  const tryAnotherEmail = () => {
    // The challenge was spent on the sign-up already sent; the passwords stay filled in
    resetTurnstile();
    focusEmail.current = true;
    setIsSuccess(false);
  };

  const onSubmit = useCallback(
    async (data: SignUpValues) => {
      if (!turnstileToken) {
        form.setError('root', { message: t('errors.turnstileRequired') });
        return;
      }

      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('turnstile-token', turnstileToken);

      try {
        const result = await signUpAction(formData);
        if (result.success) {
          setIsSuccess(true);
        } else {
          setServerError(
            form.setError,
            ['email', 'password'],
            result.error,
            getMessage(result.error),
          );
          resetTurnstile();
        }
      } catch (err: unknown) {
        form.setError('root', { message: getMessage(authErrorCodeOf(err)) });
        resetTurnstile();
      }
    },
    [form, turnstileToken, t, resetTurnstile, getMessage],
  );

  if (isSuccess) {
    // The same answer whether the e-mail is new or already has an account: it reveals nothing,
    // and "Account created!" would be false for the second (decision 5 of the review's phase 4)
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
          <Link href="/login">{t('login')}</Link>
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
      <CardContent className="flex flex-col gap-4">
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('passwordPlaceholder')}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  {/* The rule shows up front, not only as an error after sending */}
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
          </form>
        </Form>

        <GoogleSignIn />

        <div className="border-border text-muted-foreground mt-4 border-t pt-6 text-center text-sm">
          {t('alreadyHaveAccount')}{' '}
          <Link
            href="/login"
            className="text-primary-flare focus-ring rounded-sm font-semibold hover:underline"
          >
            {t('login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
