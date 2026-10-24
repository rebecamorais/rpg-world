/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/mini';

import { submitFeedbackAction } from '@frontend/actions/feedback/submit-feedback-action';
import { TurnstileWidget, useTurnstile } from '@frontend/components/security/TurnstileWidget';
import { Button } from '@frontend/components/ui/button';
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

/**
 * Feedback fields and submission, without a frame: the support page wraps it in a card
 * (`ContactCard`) and the header's dialog brings its own heading. `onSent` runs after the
 * success toast, so each one decides what comes next.
 */
export default function ContactForm({
  initialEmail = '',
  onSent,
}: {
  initialEmail?: string;
  onSent?: () => void;
}) {
  const t = useTranslations('feedback');
  const { getMessage } = useErrorMessage();
  const {
    token: turnstileToken,
    setToken: setTurnstileToken,
    resetKey: turnstileKey,
    reset: resetTurnstile,
  } = useTurnstile();

  const feedbackSchema = z.object({
    email: z.email(),
    type: z.string().check(z.minLength(1)),
    message: z.string().check(z.minLength(10)),
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
        form.reset();
        onSent?.();
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

  return (
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
                    className="focus:border-primary-glow focus:ring-primary/20 border-border bg-muted text-foreground"
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
                  className="focus:border-primary-glow focus:ring-primary/20 border-border bg-muted text-foreground resize-none"
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
  );
}
