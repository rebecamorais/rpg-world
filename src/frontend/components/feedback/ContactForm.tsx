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

import { submitFeedbackAction } from '../../../../app/support/actions';

export default function ContactForm({ initialEmail = '' }: { initialEmail?: string }) {
  const t = useTranslations('feedback');
  const [isSuccess, setIsSuccess] = useState(false);

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
    try {
      const result = await submitFeedbackAction(data);
      if (result.success) {
        toast.success(t('success'));
        setIsSuccess(true);
        form.reset();
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error(t('error'));
    }
  };

  if (isSuccess) {
    return (
      <Card className="mx-auto w-full max-w-2xl border-white/10 bg-zinc-950/50 shadow-2xl backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary-surface text-primary-flare mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-[0_0_15px_var(--primary-surface)]">
            <MessageSquare className="h-8 w-8" />
          </div>
          <CardTitle className="mb-2 text-2xl font-bold text-zinc-100">{t('success')}</CardTitle>
          <Button
            variant="ghost"
            onClick={() => setIsSuccess(false)}
            className="mt-4 text-zinc-400 hover:text-white"
          >
            {t('submit')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl border-zinc-800 bg-zinc-950 shadow-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary-surface text-primary-flare rounded-md p-2">
            <MessageSquare className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-100">
            {t('title')}
          </CardTitle>
        </div>
        <CardDescription className="text-zinc-400">{t('subtitle')}</CardDescription>
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
                    <FormLabel className="text-zinc-300">{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('emailPlaceholder')}
                        className="focus:border-primary-glow focus:ring-primary/20 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
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
                    <FormLabel className="text-zinc-300">{t('typeLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:border-primary-glow focus:ring-primary/20 border-zinc-800 bg-zinc-900 text-zinc-100">
                          <SelectValue placeholder={t('typeLabel')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
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
                  <FormLabel className="text-zinc-300">{t('messageLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('messagePlaceholder')}
                      rows={5}
                      className="focus:border-primary-glow focus:ring-primary/20 resize-none border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
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
              className="bg-primary hover:bg-primary-flare focus:ring-primary/20 w-full font-bold text-white transition-all focus:ring-2 active:scale-[0.98]"
            >
              {form.formState.isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
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
