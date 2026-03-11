import Link from 'next/link';

import { useTranslations } from 'next-intl';

import LoginForm from '@frontend/components/LoginForm';

export default function LoginPage() {
  const t = useTranslations('common');

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
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
