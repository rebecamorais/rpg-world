'use client';

import { useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { requestPasswordResetAction } from '@frontend/actions/auth/request-password-reset-action';
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

export default function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword');
  const { getMessage } = useErrorMessage();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    token: turnstileToken,
    setToken: setTurnstileToken,
    resetKey: turnstileKey,
    reset: resetTurnstile,
  } = useTurnstile();

  const schema = z.object({
    email: z.string().email({ message: t('emailLabel') }), // Simplificado para usar a label como erro se falhar zod
  });

  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: Values) => {
    if (!turnstileToken) {
      toast.error(getMessage('security_token_missing'));
      return;
    }

    try {
      const result = await requestPasswordResetAction(data.email, turnstileToken);
      if (result.success) {
        setIsSuccess(true);
      } else {
        toast.error(getMessage(result.error));
        resetTurnstile();
      }
    } catch {
      toast.error(getMessage(null));
      resetTurnstile();
    }
  };

  if (isSuccess) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle>{t('successTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('successDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">{t('backToLogin')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
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
            <div className="text-muted-foreground mt-2 text-center text-sm">
              <Link href="/login" className="text-primary-flare hover:underline">
                {t('backToLogin')}
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
