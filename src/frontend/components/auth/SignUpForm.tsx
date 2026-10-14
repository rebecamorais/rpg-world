'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { signUpAction } from '@frontend/actions/auth/sign-up-action';
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
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { newPasswordFields, passwordsMustMatch } from '@frontend/lib/password-schema';

export default function SignUpForm() {
  const t = useTranslations('register');
  const tCommon = useTranslations('common');
  const { getMessage } = useErrorMessage();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    token: turnstileToken,
    setToken: setTurnstileToken,
    resetKey: turnstileKey,
    reset: resetTurnstile,
  } = useTurnstile();

  const signUpSchema = z
    .object({
      email: z.string().email({ message: t('errors.invalidEmail') }),
      ...newPasswordFields(tCommon),
    })
    .refine(...passwordsMustMatch(tCommon));

  type SignUpValues = z.infer<typeof signUpSchema>;

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = useCallback(
    async (data: SignUpValues) => {
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
          toast.success(t('successTitle'));
          setIsSuccess(true);
        } else {
          const errorCode = result.error;
          const localizedMsg = getMessage(errorCode);

          toast.error(localizedMsg);
          resetTurnstile();
        }
      } catch {
        toast.error(tCommon('errors.unknown'));
      }
    },
    [turnstileToken, t, resetTurnstile, getMessage, tCommon],
  );

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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('passwordPlaceholder')}
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

            <TurnstileWidget key={turnstileKey} onTokenChange={setTurnstileToken} />

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

        <div className="border-border text-muted-foreground mt-4 border-t pt-6 text-center text-sm">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-primary-flare font-semibold hover:underline">
            {t('login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
