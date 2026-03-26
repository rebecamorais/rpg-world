'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import AvatarUpload from '@frontend/components/AvatarUpload';
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
import { Skeleton } from '@frontend/components/ui/skeleton';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useProfile } from '@frontend/hooks/useProfile';

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

  const { profile, isLoading, updateProfile, isUpdating, uploadAvatar, isUploadingAvatar } =
    useProfile();

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

  // Populate form when profile data loads
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
    const timestampedUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    form.setValue('avatarUrl', timestampedUrl);
    toast.success(t('saveSuccess'));
  };

  const handleAvatarUploadError = (err: unknown) => {
    const errorCode = err instanceof Error ? err.message : 'unknown';
    const localizedMsg = getMessage(errorCode);
    toast.error(localizedMsg);
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
      <Card className="mx-auto w-full max-w-lg border-white/10 bg-black/60 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-7 w-48 bg-white/10" />
          <Skeleton className="h-4 w-72 bg-white/10" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
        </CardContent>
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
              <AvatarUpload
                currentUrl={avatarUrl}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleAvatarUploadError}
                uploadFn={uploadAvatar}
                isUploading={isUploadingAvatar}
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
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={field.value ?? '#663399'}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Live preview — update the CSS variable immediately
                          document.documentElement.style.setProperty('--primary', e.target.value);
                        }}
                        className="h-9 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent p-0.5"
                        id="primary-color-picker"
                      />
                      <span className="font-mono text-sm text-gray-400">
                        {field.value ?? '#663399'}
                      </span>
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
