import Link from 'next/link';

import ForgotPasswordForm from '@/frontend/components/auth/ForgotPasswordForm';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations('common');

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {t('back')}
        </Link>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
