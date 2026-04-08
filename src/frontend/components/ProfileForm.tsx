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
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useProfile } from '@frontend/hooks/useProfile';
import { cn } from '@frontend/lib/utils';

const PREDEFINED_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: 'var(--red)' },
  { name: 'Blue', value: 'var(--blue)' },
  { name: 'Green', value: 'var(--green)' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Yellow', value: 'var(--yellow)' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
];

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
      .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
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
      form.reset({
        username: profile.username ?? '',
        fullName: profile.fullName ?? '',
        avatarUrl: profile.avatarUrl ?? '',
        primaryColor: profile.primaryColor ?? '#663399',
      });
    }
  }, [profile, form]);

  // Called by AvatarUpload when the upload completes — update the form field with a cache buster
  const handleAvatarUploadSuccess = (url: string) => {
    form.setValue('avatarUrl', url);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success(t('saveSuccess'));
  };

  const handleAvatarUploadError = (err: unknown) => {
    const errorCode = err instanceof Error ? err.message : 'unknown';
    toast.error(getMessage(errorCode));
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
      <Card className="mx-auto w-full max-w-lg border-white/10 bg-black/60 py-12 backdrop-blur-md">
        <LoadingState thematic />
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
          {t('title')}
        </CardTitle>
        <CardDescription className="text-gray-400">{t('subtitle')}</CardDescription>
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
                onUploadError={handleAvatarUploadError}
                size="lg"
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">{t('usernameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('usernamePlaceholder')}
                      autoComplete="username"
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus:border-blue-500/50"
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
                  <FormLabel className="text-gray-300">{t('fullNameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('fullNamePlaceholder')}
                      autoComplete="name"
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus:border-blue-500/50"
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
                  <FormLabel className="text-gray-300">{t('primaryColorLabel')}</FormLabel>
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
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-transparent',
                            )}
                            title={color.name}
                          >
                            <div
                              className="h-7 w-7 rounded-full shadow-sm"
                              style={{ backgroundColor: color.value || '#663399' }}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
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

            {form.formState.errors.root && (
              <p className="text-sm text-red-400">{form.formState.errors.root.message}</p>
            )}

            <Button
              type="submit"
              disabled={isUpdating || form.formState.isSubmitting}
              className="mt-2 w-full bg-blue-600 font-semibold transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? t('saving') : t('save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
