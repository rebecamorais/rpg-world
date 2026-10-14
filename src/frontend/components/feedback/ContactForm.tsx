/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */

'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { submitFeedbackAction } from '@frontend/actions/feedback/submit-feedback-action';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { Textarea } from '@frontend/components/ui/textarea';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

import { UNEXPECTED_ERROR } from '@shared/http/error-response';

export default function ContactForm({ initialEmail = '' }: { initialEmail?: string }) {
  const t = useTranslations('feedback');
  const { getMessage } = useErrorMessage();
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    token: turnstileToken,
    setToken: setTurnstileToken,
    resetKey: turnstileKey,
    reset: resetTurnstile,
  } = useTurnstile();

  const feedbackSchema = z.object({
    email: z.string().email(),
    type: z.string().min(1),
    message: z.string().min(10),
  });

  type FeedbackFormValues = z.infer<typeof feedbackSchema>;

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      email: initialEmail,
      type: 'feedback',
      message: '',
    },
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    if (!turnstileToken) {
      toast.error(getMessage('security_token_missing'));
      return;
    }

    try {
      const result = await submitFeedbackAction({ ...data, turnstileToken });
      if (result.success) {
        toast.success(t('success'));
        setIsSuccess(true);
        form.reset();
      } else {
        // Security and validation codes tell the user what to fix; anything else keeps the
        // themed generic message
        toast.error(result.error === UNEXPECTED_ERROR ? t('error') : getMessage(result.error));
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error(t('error'));
    }
    // Tokens are single-use, so a new submission needs a fresh challenge either way
    resetTurnstile();
  };

  if (isSuccess) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-2xl shadow-2xl backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary-surface text-primary-flare mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-[0_0_15px_var(--primary-surface)]">
            <MessageSquare className="h-8 w-8" />
          </div>
          <CardTitle className="mb-2">{t('success')}</CardTitle>
          <Button
            variant="ghost"
            onClick={() => setIsSuccess(false)}
            className="text-muted-foreground hover:text-foreground mt-4"
          >
            {t('submit')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card mx-auto w-full max-w-2xl shadow-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary-surface text-primary-flare rounded-md p-2">
            <MessageSquare className="h-5 w-5" />
          </div>
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('emailPlaceholder')}
                        className="focus:border-primary-glow focus:ring-primary/20 border-border bg-muted text-foreground placeholder:text-muted-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('typeLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:border-primary-glow focus:ring-primary/20 border-border bg-muted text-foreground">
                          <SelectValue placeholder={t('typeLabel')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-border bg-muted text-foreground">
                        <SelectItem value="bug">{t('types.bug')}</SelectItem>
                        <SelectItem value="feature">{t('types.feature')}</SelectItem>
                        <SelectItem value="feedback">{t('types.feedback')}</SelectItem>
                        <SelectItem value="account">{t('types.account')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{t('messageLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('messagePlaceholder')}
                      rows={5}
                      className="focus:border-primary-glow focus:ring-primary/20 border-border bg-muted text-foreground placeholder:text-muted-foreground resize-none"
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
              className="w-full font-bold"
            >
              {form.formState.isSubmitting ? (
                t('submitting')
              ) : (
                <>
                  <Send aria-hidden="true" />
                  {t('submit')}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
