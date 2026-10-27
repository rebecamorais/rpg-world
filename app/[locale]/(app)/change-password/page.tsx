'use client';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod/mini';

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
import { useAuth } from '@frontend/hooks/useAuth';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { setServerError } from '@frontend/lib/form-errors';
import { newPasswordSchema } from '@frontend/lib/password-schema';

export default function ChangePasswordPage() {
  const t = useTranslations('changePassword');
  const commonT = useTranslations('common');
  const { updatePassword } = useAuth();
  const { getErrorMessage } = useErrorMessage();

  const changePasswordSchema = newPasswordSchema(commonT);

  type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    try {
      await updatePassword(data.password);
      toast.success(t('success'));
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : null;
      setServerError(form.setError, ['password'], code, getErrorMessage(err));
    }
  };

  return (
    <div className="bg-background relative flex flex-1 items-center justify-center p-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {commonT('back')}
        </Link>
      </div>

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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('newPasswordPlaceholder')}
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

              <FormRootError />
              <Button
                type="submit"
                loading={form.formState.isSubmitting}
                className="mt-2 w-full font-semibold"
              >
                {form.formState.isSubmitting ? t('processing') : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
