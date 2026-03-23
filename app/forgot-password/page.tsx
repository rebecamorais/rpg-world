import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import Footer from '@frontend/components/Footer';
import ForgotPasswordForm from '@frontend/components/auth/ForgotPasswordForm';

export default async function ForgotPasswordPage() {
  const t = await getTranslations('common');

  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-background relative flex flex-1 items-center justify-center p-4">
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
      <Footer />
    </div>
  );
}
