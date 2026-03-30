import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import SignUpForm from '@frontend/components/auth/SignUpForm';
import Footer from '@frontend/components/layout/Footer';

export default async function RegisterPage() {
  const t = await getTranslations('common');

  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-background relative flex flex-1 items-center justify-center p-4">
        <div className="absolute top-4 left-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {t('back')}
          </Link>
        </div>
        <SignUpForm />
      </div>
      <Footer />
    </div>
  );
}
