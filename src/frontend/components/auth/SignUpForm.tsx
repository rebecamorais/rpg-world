'use client';

import { useState, useEffect, useRef } from 'react';
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
import { signUpAction } from '@/frontend/actions/auth/sign-up-action';
import Link from 'next/link';

declare global {
  interface Window {
    onloadTurnstileCallback: () => void;
    turnstile: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

export default function SignUpForm() {
  const t = useTranslations('register');
  const tCommon = useTranslations('common');
  const [isSuccess, setIsSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const signUpSchema = z.object({
    email: z.string().email({ message: tCommon('errors.invalidEmail') }),
    password: z.string().min(8, { message: tCommon('errors.passwordMinLength') }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('errors.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

  type SignUpValues = z.infer<typeof signUpSchema>;

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (turnstileRef.current && window.turnstile) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken(null);
          },
        });
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const onSubmit = async (data: SignUpValues) => {
    if (!turnstileToken) {
      toast.error(t('errors.turnstileRequired'));
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
        toast.error(result.error || tCommon('errors.unknown'));
        // Reset turnstile on error
        if (widgetIdRef.current) window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken(null);
      }
    } catch (err: any) {
      toast.error(tCommon('errors.unknown'));
    }
  };

  if (isSuccess) {
    return (
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">{t('successTitle')}</CardTitle>
          <CardDescription className="text-gray-400">
            {t('successDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href="/login">{t('login')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
          {t('title')}
        </CardTitle>
        <CardDescription className="text-gray-400">{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
                      className="border-white/10 bg-white/5 text-white focus:border-blue-500/50"
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
                  <FormLabel className="text-gray-300">{t('passwordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('passwordPlaceholder')}
                      className="border-white/10 bg-white/5 text-white focus:border-blue-500/50"
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
                  <FormLabel className="text-gray-300">{t('confirmPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('confirmPasswordPlaceholder')}
                      className="border-white/10 bg-white/5 text-white focus:border-blue-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div ref={turnstileRef} className="my-2 flex justify-center" />

            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !turnstileToken}
              className="mt-2 w-full bg-blue-600 font-semibold transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? t('processing') : t('submit')}
            </Button>
          </form>
        </Form>

        <div className="mt-2 text-center text-sm text-gray-400">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            {t('login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
