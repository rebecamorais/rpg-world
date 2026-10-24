'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/mini';

import ImageUpload from '@frontend/components/shared/ImageUpload';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import { Card } from '@frontend/components/ui/card';
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
import { SectionCard } from '@frontend/components/ui/section-card';
import { ACCENT_COLORS } from '@frontend/constants/accent-colors';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useProfile } from '@frontend/hooks/useProfile';
import { cn } from '@frontend/lib/utils';

/** Optional, and an empty field counts as not filled in. */
const orEmpty = <T extends z.ZodMiniType>(schema: T) =>
  z.union([z.optional(schema), z.literal('')]);

export default function ProfileForm() {
  const t = useTranslations('profileForm');
  const { getMessage } = useErrorMessage();

  const profileSchema = z.object({
    username: orEmpty(
      z
        .string()
        .check(
          z.minLength(3, t('validation.usernameMin')),
          z.maxLength(30, t('validation.usernameMax')),
          z.regex(/^[a-z0-9_]+$/, t('validation.usernamePattern')),
        ),
    ),
    fullName: orEmpty(z.string().check(z.maxLength(100, t('validation.fullNameMax')))),
    avatarUrl: orEmpty(z.url(t('validation.avatarUrlInvalid'))),
    primaryColor: orEmpty(
      z.string().check(z.regex(/^#[0-9a-fA-F]{6}$/, t('validation.primaryColorInvalid'))),
    ),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;
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

  // The upload only stores the file: its URL (versioned, so used as is) is saved right away,
  // like the success toast says, instead of waiting for the form's Save button
  const handleAvatarUploadSuccess = async (url: string) => {
    // Shown at once (the upload's preview is already gone). Dirty while saving, so a refetch still
    // answering for the previous upload can't put the old URL back (the backend deletes the file
    // an avatar replaces); once saved it becomes the field's value, or is undone if saving fails.
    form.setValue('avatarUrl', url, { shouldDirty: true });
    try {
      await updateProfile({ avatarUrl: url });
      form.resetField('avatarUrl', { defaultValue: url });
      toast.success(t('saveSuccess'));
    } catch (err: unknown) {
      form.resetField('avatarUrl');
      toast.error(getMessage(err instanceof Error ? err.message : 'unknown'));
    }
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
      <Card className="py-12">
        <LoadingState thematic />
      </Card>
    );
  }

  return (
    <SectionCard>
      <SectionCard.Header className="sm:px-6">
        <SectionCard.Title icon="User">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="sm:p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8"
          >
            {/* Avatar upload — on top on phones, beside the fields from md up */}
            <div className="flex justify-center md:shrink-0">
              <ImageUpload
                currentUrl={avatarUrl}
                target="profile"
                onUploadSuccess={handleAvatarUploadSuccess}
                size="lg"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-5">
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
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ACCENT_COLORS.map((color) => {
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
                className="mt-1 w-full font-semibold disabled:opacity-50 sm:w-auto sm:self-end"
              >
                {isUpdating ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
        </Form>
      </SectionCard.Body>
    </SectionCard>
  );
}
