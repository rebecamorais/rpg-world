import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import LoginForm from '@frontend/components/auth/LoginForm';

export default async function LoginPage() {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (user) {
    redirect('/characters');
  }

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
