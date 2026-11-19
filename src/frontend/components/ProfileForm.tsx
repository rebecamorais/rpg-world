'use client';

import { useEffect } from 'react';

import { usePathname } from 'next/navigation';

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
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useProfile } from '@frontend/hooks/useProfile';
import { useLeaveGuard } from '@frontend/hooks/useUnsavedChanges';
import { errorCodeOf } from '@frontend/lib/error-message';

/** Optional, and an empty field counts as not filled in. */
const orEmpty = <T extends z.ZodMiniType>(schema: T) =>
  z.union([z.optional(schema), z.literal('')]);

export default function ProfileForm() {
  const t = useTranslations('profileForm');
  const tAvatar = useTranslations('avatarUpload');
  const tCommon = useTranslations('common');
  const { getErrorMessage } = useErrorMessage();
  const pathname = usePathname();

  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  const profileSchema = z.object({
    username: orEmpty(
      z.string().check(
        z.minLength(3, t('validation.usernameMin')),
        z.maxLength(30, t('validation.usernameMax')),
        // The format applies to a new username only: one chosen before the rule (an old
        // "playerChilli") keeps saving as is, as the server allows
        z.refine(
          (username) => username === profile?.username || /^[a-z0-9_]+$/.test(username),
          t('validation.usernamePattern'),
        ),
      ),
    ),
    fullName: orEmpty(z.string().check(z.maxLength(100, t('validation.fullNameMax')))),
    avatarUrl: orEmpty(z.url(t('validation.avatarUrlInvalid'))),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      fullName: '',
      avatarUrl: '',
    },
  });

  // Leaving with an edited name asks first, like the sheet. The avatar never counts: it is saved
  // as soon as it's uploaded.
  useLeaveGuard(form.formState.isDirty, (path) => path === pathname, tCommon('leaveConfirm'));

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
        },
        { keepDirtyValues: true },
      );
    }
  }, [profile, form]);

  // The upload only stores the file: its URL (versioned, so used as is) is saved right away,
  // like the success toast says, instead of waiting for the form's Save button
  // `url` is '' to remove the avatar
  const saveAvatar = async (url: string, successMessage = t('saveSuccess')) => {
    // Shown at once (the upload's preview is already gone). Dirty while saving, so a refetch still
    // answering for the previous upload can't put the old URL back (the backend deletes the file
    // an avatar replaces); once saved it becomes the field's value, or is undone if saving fails.
    form.setValue('avatarUrl', url, { shouldDirty: true });
    try {
      await updateProfile({ avatarUrl: url });
      form.resetField('avatarUrl', { defaultValue: url });
      toast.success(successMessage);
    } catch (err: unknown) {
      form.resetField('avatarUrl');
      toast.error(getErrorMessage(err));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // An empty name is sent as empty, which clears it; an empty username keeps the current one
      // (it can't be blank). The avatar isn't sent: it was saved when uploaded.
      await updateProfile({
        username: data.username || undefined,
        fullName: data.fullName ?? '',
      });
      // What was saved is the new starting point, so leaving no longer asks
      form.reset(data);
      toast.success(t('saveSuccess'));
    } catch (err: unknown) {
      // Shown on the form, where it can be read and fixed: a taken username under its field. A
      // dropped connection says so, and the edits stay in the fields.
      const message = getErrorMessage(err);
      if (errorCodeOf(err) === 'profile_error_username_taken') {
        form.setError('username', { message }, { shouldFocus: true });
      } else {
        form.setError('root', { message });
      }
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
                name={profile?.username}
                target="profile"
                onUploadSuccess={saveAvatar}
                onRemove={() => saveAvatar('', tAvatar('removed'))}
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
                        spellCheck={false}
                        autoCapitalize="none"
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
