'use client';

import { useEffect, useId, useRef, useState } from 'react';

import Link from 'next/link';

import { localizedHref } from '@/i18n/routing';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

import { requestMagicLinkAction } from '@frontend/actions/auth/request-magic-link-action';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import { useAuth } from '@frontend/hooks/useAuth';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { setServerError } from '@frontend/lib/form-errors';
import { rememberNext } from '@frontend/lib/post-login-next';

interface LoginFormValues {
  email: string;
  password?: string;
}

type AuthMode = 'password' | 'magic';

/**
 * An unconfirmed account gets the same "Incorrect email or password." as a wrong password (so the
 * answer reveals nothing), and only the magic link confirms it. So that answer always points there.
 */
const POINTS_TO_MAGIC_LINK = new Set([
  'auth_error_signin_invalid_credentials',
  'auth_error_signin_email_not_confirmed',
]);

export default function LoginForm() {
  // A link opened while signed out (e.g. a table invite) is where the person goes after signing in
  useEffect(rememberNext, []);
  const { signInWithPassword } = useAuth();
  const t = useTranslations('login');
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const { getMessage } = useErrorMessage();
  const titleId = useId();
  const [emailSent, setEmailSent] = useState(false);
  // Most accounts have a password, so the login opens on it
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [showMagicLinkHint, setShowMagicLinkHint] = useState(false);
  // The control that moved the focus is gone after the switch, so the e-mail field takes it
  const focusEmail = useRef(false);
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

  useEffect(() => {
    if (!focusEmail.current || emailSent) return;
    focusEmail.current = false;
    form.setFocus('email', { shouldSelect: true });
  }, [authMode, emailSent, form]);

  const switchMode = (mode: AuthMode, { moveFocus = false } = {}) => {
    form.clearErrors();
    setShowMagicLinkHint(false);
    focusEmail.current = moveFocus;
    setAuthMode(mode);
  };

  const tryAnotherEmail = () => {
    // The challenge was spent on the link already sent
    resetTurnstile();
    focusEmail.current = true;
    setEmailSent(false);
  };

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
    setShowMagicLinkHint(false);
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
      const errorCode = authErrorCodeOf(err);
      setServerError(form.setError, ['email', 'password'], errorCode, getMessage(errorCode));
      if (authMode === 'magic') resetTurnstile();
      setShowMagicLinkHint(authMode === 'password' && POINTS_TO_MAGIC_LINK.has(errorCode ?? ''));
    }
  };

  if (emailSent) {
    return (
      <AuthSuccessCard
        title={t('verifyEmailTitle')}
        description={t.rich('verifyEmailDescription', {
          email: form.getValues('email'),
          bold: (chunks) => <strong className="text-foreground">{chunks}</strong>,
        })}
      >
        <Button variant="outline" className="w-full" onClick={tryAnotherEmail}>
          {tCommon('useAnotherEmail')}
        </Button>
      </AuthSuccessCard>
    );
  }

  return (
    <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle as="h1" id={titleId}>
          {t('title')}
        </CardTitle>
        <CardDescription className="text-muted-foreground">{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs value={authMode} onValueChange={(mode) => switchMode(mode as AuthMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="password" className="touch-target flex-1">
              {t('passwordTab')}
            </TabsTrigger>
            <TabsTrigger value="magic" className="touch-target flex-1">
              {t('magicLinkTab')}
            </TabsTrigger>
          </TabsList>

          {/* One panel for both tabs: the e-mail field is shared, only what's under it changes.
              Named by the card's title, not by the tab: a panel named "Password" would be a
              second match for the password field's label. */}
          <TabsContent value={authMode} aria-labelledby={titleId} className="mt-4">
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

                {authMode === 'password' && (
                  <div className="flex flex-col gap-2">
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
                              autoComplete="current-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {showMagicLinkHint && (
                      <p className="text-muted-foreground text-sm">
                        {t.rich('unconfirmedHint', {
                          magic: (chunks) => (
                            <button
                              type="button"
                              onClick={() => switchMode('magic', { moveFocus: true })}
                              className="text-primary-flare focus-ring touch-target rounded-sm font-semibold hover:underline"
                            >
                              {chunks}
                            </button>
                          ),
                        })}
                      </p>
                    )}
                    {/* After the password field, so Tab goes from the e-mail straight to it */}
                    <Link
                      href="/forgot-password"
                      className="text-primary-flare focus-ring touch-target self-end rounded-sm text-sm hover:underline"
                    >
                      {t('forgotPassword')}
                    </Link>
                  </div>
                )}

                {authMode === 'magic' && (
                  <>
                    <p className="text-muted-foreground text-center text-sm">
                      {t('magicLinkHint')}
                    </p>
                    {/* The link is sent by us through the admin API, so a human check comes first */}
                    <TurnstileWidget key={turnstileKey} onTokenChange={setTurnstileToken} />
                  </>
                )}

                <FormRootError />
                {/* Waits for the security check: a click before it passes would only get an error */}
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
          </TabsContent>
        </Tabs>

        <GoogleSignIn />

        <div className="border-border text-muted-foreground mt-4 border-t pt-6 text-center text-sm">
          {t('noAccount')}{' '}
          <Link
            href={localizedHref('/register', locale)}
            className="text-primary-flare focus-ring rounded-sm font-semibold hover:underline"
          >
            {t('register')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
