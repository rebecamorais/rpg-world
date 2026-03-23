'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

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
import { createBrowserClient } from '@supabase/ssr';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export default function ResetPasswordForm() {
  const t = useTranslations('resetPassword');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  useEffect(() => {
    // getSession() will automatically handle the hash in the URL and set the session
    supabase.auth.getSession().finally(() => {
      setIsInitializing(false);
    });
  }, [supabase.auth]);

  const schema = z
    .object({
      password: z.string().min(8, { message: t('newPasswordLabel') }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('newPasswordLabel'),
      path: ['confirmPassword'],
    });

  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: Values) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message || 'Erro ao redefinir senha');
      } else {
        setIsSuccess(true);
        toast.success(t('successTitle'));
      }
    } catch {
      toast.error('Erro inesperado');
    }
  };

  if (isInitializing) {
    return (
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
        <CardContent className="pt-6 text-center text-gray-400">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          {t('processing')}...
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">{t('successTitle')}</CardTitle>
          <CardDescription className="text-gray-400">{t('successDescription')}</CardDescription>
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
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">{t('newPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('newPasswordPlaceholder')}
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
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-2 w-full bg-blue-600 font-semibold transition-all hover:bg-blue-700"
            >
              {form.formState.isSubmitting ? t('processing') : t('submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
