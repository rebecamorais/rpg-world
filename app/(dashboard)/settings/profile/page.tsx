import { useTranslations } from 'next-intl';

import ProfileForm from '@frontend/components/ProfileForm';

export default function ProfilePage() {
  const t = useTranslations('dashboard');

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('settingsTitle')}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t('settingsSubtitle')}</p>
      </div>
      <ProfileForm />
    </main>
  );
}
