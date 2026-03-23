'use client';

import { useState } from 'react';

import Link from 'next/link';

import { requestPasswordResetAction } from '@/frontend/actions/auth/request-password-reset-action';
import { Button } from '@/frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/frontend/components/ui/form';
import { Input } from '@/frontend/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export default function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword');
  const [isSuccess, setIsSuccess] = useState(false);

  const schema = z.object({
    email: z.string().email({ message: t('emailLabel') }), // Simplificado para usar a label como erro se falhar zod
  });

  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: Values) => {
    try {
      const result = await requestPasswordResetAction(data.email);
      if (result.success) {
        setIsSuccess(true);
      } else {
        toast.error(result.error || 'Erro ao solicitar recuperação');
      }
    } catch {
      toast.error('Erro inesperado');
    }
  };

  if (isSuccess) {
    return (
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">{t('successTitle')}</CardTitle>
          <CardDescription className="text-gray-400">{t('successDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href="/login">{t('backToLogin')}</Link>
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
      <CardContent>
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
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-2 w-full bg-blue-600 font-semibold transition-all hover:bg-blue-700"
            >
              {form.formState.isSubmitting ? t('processing') : t('submit')}
            </Button>
            <div className="mt-2 text-center text-sm text-gray-400">
              <Link href="/login" className="text-blue-400 hover:underline">
                {t('backToLogin')}
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
