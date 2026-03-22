'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useErrorMessage } from '@/frontend/hooks/useErrorMessage';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { useAuth } from '@frontend/hooks/useAuth';

interface LoginFormValues {
  email: string;
  password?: string;
}

export default function LoginForm() {
  const { sendMagicLink, signInWithPassword } = useAuth();
  const t = useTranslations('login');
  const { getMessage } = useErrorMessage();
  const [emailSent, setEmailSent] = useState(false);
  const [authMode, setAuthMode] = useState<'magic' | 'password'>('password');

  const loginSchema = z.object({
    email: z.string().email({ message: t('invalidEmailError') }),
    password: z.string().optional(),
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      if (authMode === 'magic') {
        await sendMagicLink(data.email);
        setEmailSent(true);
      } else {
        if (!data.password) {
          form.setError('password', { message: t('passwordRequiredError') });
          return;
        }
        await signInWithPassword(data.email, data.password);
      }
    } catch (err: unknown) {
      const errorCode = err instanceof Error ? err.message : 'unknown';
      const localizedMsg = getMessage(errorCode);

      toast.error(localizedMsg);
      form.setError('root', { message: localizedMsg });
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  if (emailSent) {
    return (
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">{t('verifyEmailTitle')}</CardTitle>
          <CardDescription className="text-gray-400">
            {t.rich('verifyEmailDescription', {
              email: form.getValues('email'),
              bold: (chunks) => <strong className="text-white">{chunks}</strong>,
            })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
      <div className="border-b border-white/5 bg-blue-500/10 p-3 italic">
        <p className="text-center text-xs leading-relaxed text-blue-300">
          {t('manualRegistrationNotice')}
        </p>
      </div>
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
          {t('title')}
        </CardTitle>
        <CardDescription className="text-gray-400">{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex rounded-lg bg-white/5 p-1">
          <button
            onClick={() => setAuthMode('magic')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              authMode === 'magic'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('magicLinkTab')}
          </button>
          <button
            onClick={() => setAuthMode('password')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              authMode === 'password'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
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
                  <FormLabel className="text-gray-300">{t('emailLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      autoComplete="email"
                      className="border-white/10 bg-white/5 text-white focus:border-blue-500/50"
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
                    <FormLabel className="text-gray-300">{t('passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        autoComplete="current-password"
                        className="border-white/10 bg-white/5 text-white focus:border-blue-500/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {authMode === 'magic' && (
              <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-2.5">
                <p className="text-center text-sm text-yellow-500/80">
                  {t('magicLinkDisabledWarning')}
                </p>
              </div>
            )}

            {form.formState.errors.root && (
              <p className="text-sm text-red-400">{form.formState.errors.root.message}</p>
            )}

            <Button
              type="submit"
              disabled={authMode === 'magic' || form.formState.isSubmitting}
              className={`mt-2 w-full font-semibold transition-all ${
                authMode === 'magic'
                  ? 'cursor-not-allowed bg-blue-600/30 opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {form.formState.isSubmitting
                ? t('processing')
                : authMode === 'magic'
                  ? t('magicLinkDisabledButton')
                  : t('submit')}
            </Button>
          </form>
        </Form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm uppercase">
            <span className="bg-black/60 px-2 text-gray-500">{t('dividerText')}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-not-allowed border-white/10 bg-white/5 text-gray-300 opacity-50 hover:bg-white/10 hover:text-white"
          disabled
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          {t('googleLogin')}
        </Button>

        <div className="mt-2 text-center text-sm text-gray-400">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            {t('register')}
          </Link>
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
