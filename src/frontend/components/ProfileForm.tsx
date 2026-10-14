'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import ImageUpload from '@frontend/components/shared/ImageUpload';
import { LoadingState } from '@frontend/components/shared/LoadingState';
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
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useProfile } from '@frontend/hooks/useProfile';
import { cn } from '@frontend/lib/utils';

// Hex values: the profile schema (and the API) only accept #rrggbb
const PREDEFINED_COLORS = [
  { name: 'default', value: '' },
  { name: 'red', value: '#ef4444' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'green', value: '#22c55e' },
  { name: 'purple', value: '#a855f7' },
  { name: 'yellow', value: '#eab308' },
  { name: 'orange', value: '#f97316' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'pink', value: '#ec4899' },
  { name: 'slate', value: '#64748b' },
] as const;

export default function ProfileForm() {
  const t = useTranslations('profileForm');
  const { getMessage } = useErrorMessage();

  const profileSchema = z.object({
    username: z
      .string()
      .min(3, t('validation.usernameMin'))
      .max(30, t('validation.usernameMax'))
      .regex(/^[a-z0-9_]+$/, t('validation.usernamePattern'))
      .optional()
      .or(z.literal('')),
    fullName: z.string().max(100, t('validation.fullNameMax')).optional().or(z.literal('')),
    avatarUrl: z.string().url(t('validation.avatarUrlInvalid')).optional().or(z.literal('')),
    primaryColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, t('validation.primaryColorInvalid'))
      .optional()
      .or(z.literal('')),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;
  const queryClient = useQueryClient();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      fullName: '',
      avatarUrl: '',
      primaryColor: '#663399',
    },
  });

  const avatarUrl = useWatch({
    control: form.control,
    name: 'avatarUrl',
  });

  useEffect(() => {
    if (profile) {
      // A refetch (e.g. after an avatar upload) must not wipe fields the user is editing
      form.reset(
        {
          username: profile.username ?? '',
          fullName: profile.fullName ?? '',
          avatarUrl: profile.avatarUrl ?? '',
          primaryColor: profile.primaryColor ?? '#663399',
        },
        { keepDirtyValues: true },
      );
    }
  }, [profile, form]);

  // Called by AvatarUpload when the upload completes — the URL is versioned, so it is used as is
  const handleAvatarUploadSuccess = (url: string) => {
    form.setValue('avatarUrl', url);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success(t('saveSuccess'));
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({
        username: data.username || undefined,
        fullName: data.fullName || undefined,
        avatarUrl: data.avatarUrl || undefined,
        primaryColor: data.primaryColor || undefined,
      });
      toast.success(t('saveSuccess'));
    } catch (err: unknown) {
      const errorCode = err instanceof Error ? err.message : 'unknown';
      const localizedMsg = getMessage(errorCode);
      toast.error(localizedMsg);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-lg py-12 backdrop-blur-md">
        <LoadingState thematic />
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 mx-auto w-full max-w-lg shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle as="h2">{t('title')}</CardTitle>
        <CardDescription className="text-muted-foreground">{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Avatar upload — at the top, centered */}
            <div className="flex justify-center">
              <ImageUpload
                currentUrl={avatarUrl}
                target="profile"
                onUploadSuccess={handleAvatarUploadSuccess}
                size="lg"
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('usernameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('usernamePlaceholder')}
                      autoComplete="username"
                      className="border-border bg-muted text-foreground focus:border-primary-flare"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fullNameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('fullNamePlaceholder')}
                      autoComplete="name"
                      className="border-border bg-muted text-foreground focus:border-primary-flare"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('primaryColorLabel')}</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-5 gap-3 pt-2">
                      {PREDEFINED_COLORS.map((color) => {
                        const isSelected =
                          color.value === field.value || (!color.value && !field.value);

                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => field.onChange(color.value)}
                            className={cn(
                              'group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all hover:scale-110',
                              isSelected
                                ? 'border-primary-flare ring-primary-flare/20 ring-2'
                                : 'border-transparent',
                            )}
                            title={t(`colors.${color.name}`)}
                            aria-label={t(`colors.${color.name}`)}
                            aria-pressed={isSelected}
                          >
                            <div
                              className="h-7 w-7 rounded-full shadow-sm"
                              style={{ backgroundColor: color.value || 'var(--brand)' }}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-foreground h-1.5 w-1.5 rounded-full shadow-sm" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormRootError />
            <Button
              type="submit"
              loading={isUpdating || form.formState.isSubmitting}
              className="mt-2 w-full font-semibold disabled:opacity-50"
            >
              {isUpdating ? t('saving') : t('save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
