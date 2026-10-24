import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import LoginForm from '@frontend/components/auth/LoginForm';

/** Whoever is already signed in never sees this page: the proxy sends them to /characters. */
export default async function LoginPage() {
  const t = await getTranslations('common');

  return (
    <div className="bg-background relative flex flex-1 items-center justify-center p-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {t('back')}
        </Link>
      </div>
      <LoginForm />
    </div>
  );
}
