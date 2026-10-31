'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

import { requestMagicLinkAction } from '@frontend/actions/auth/request-magic-link-action';
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
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { useAuth } from '@frontend/hooks/useAuth';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { setServerError } from '@frontend/lib/form-errors';
import { rememberNext } from '@frontend/lib/post-login-next';

interface LoginFormValues {
  email: string;
  password?: string;
}

export default function LoginForm() {
  // A link opened while signed out (e.g. a table invite) is where the person goes after signing in
  useEffect(rememberNext, []);
  const { signInWithPassword } = useAuth();
  const t = useTranslations('login');
  const { getMessage } = useErrorMessage();
  const [emailSent, setEmailSent] = useState(false);
  const [authMode, setAuthMode] = useState<'magic' | 'password'>('password');
  const {
    token: turnstileToken,
    setToken: setTurnstileToken,
    resetKey: turnstileKey,
    reset: resetTurnstile,
  } = useTurnstile();

  const loginSchema = z.object({
    email: z.email(t('invalidEmailError')),
    password: z.optional(z.string()),
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const sendMagicLink = async (email: string) => {
    if (!turnstileToken) {
      form.setError('root', { message: getMessage('security_token_missing') });
      return;
    }

    const result = await requestMagicLinkAction(email, turnstileToken);
    if (result.success) {
      setEmailSent(true);
    } else {
      setServerError(form.setError, ['email'], result.error, getMessage(result.error));
      resetTurnstile();
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      if (authMode === 'magic') {
        await sendMagicLink(data.email);
      } else {
        if (!data.password) {
          form.setError('password', { message: t('passwordRequiredError') });
          return;
        }
        await signInWithPassword(data.email, data.password);
      }
    } catch (err: unknown) {
      const errorCode = err instanceof Error ? err.message : 'unknown';
      setServerError(form.setError, ['email', 'password'], errorCode, getMessage(errorCode));
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  if (emailSent) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle as="h1">{t('verifyEmailTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t.rich('verifyEmailDescription', {
              email: form.getValues('email'),
              bold: (chunks) => <strong className="text-foreground">{chunks}</strong>,
            })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle as="h1">{t('title')}</CardTitle>
        <CardDescription className="text-muted-foreground">{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="bg-muted flex rounded-lg p-1">
          <button
            onClick={() => setAuthMode('magic')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              authMode === 'magic'
                ? 'bg-primary text-primary-on shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('magicLinkTab')}
          </button>
          <button
            onClick={() => setAuthMode('password')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              authMode === 'password'
                ? 'bg-primary text-primary-on shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('passwordTab')}
          </button>
        </div>

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
                      className="bg-muted/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {authMode === 'password' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t('passwordLabel')}</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-primary-flare text-xs hover:underline"
                      >
                        {t('forgotPassword')}
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        autoComplete="current-password"
                        className="bg-muted/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {authMode === 'magic' && (
              <>
                <p className="text-muted-foreground text-center text-sm">{t('magicLinkHint')}</p>
                {/* The link is sent by us through the admin API, so a human check comes first */}
                <TurnstileWidget key={turnstileKey} onTokenChange={setTurnstileToken} />
              </>
            )}

            <FormRootError />
            <Button
              type="submit"
              disabled={authMode === 'magic' && !turnstileToken}
              loading={form.formState.isSubmitting}
              className="mt-2 w-full font-semibold"
            >
              {form.formState.isSubmitting
                ? t('processing')
                : authMode === 'magic'
                  ? t('magicLinkSubmit')
                  : t('submit')}
            </Button>
          </form>
        </Form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="border-border w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm uppercase">
            <span className="bg-card text-muted-foreground px-2">{t('dividerText')}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="bg-muted hover:bg-background w-full"
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          {t('googleLogin')}
        </Button>

        <div className="border-border mt-4 flex flex-col gap-4 border-t pt-6 text-center">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">{t('noAccount')}</p>
            <p className="text-muted-foreground text-xs">{t('noAccountSubtitle')}</p>
          </div>
          <Button
            variant="outline"
            asChild
            className="bg-primary/5 hover:bg-primary/10 w-full shadow-sm"
          >
            <Link href="/register" className="flex items-center gap-2">
              <AppIcon name="UserPlus" size={16} className="text-primary-flare" />
              {t('register')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
