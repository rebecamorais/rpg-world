import { useTranslations } from 'next-intl';

import ProfileForm from '@frontend/components/ProfileForm';

export default function ProfilePage() {
  const t = useTranslations('dashboard');

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-foreground text-2xl font-bold">{t('settingsTitle')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('settingsSubtitle')}</p>
      </div>
      <ProfileForm />
    </div>
  );
}
