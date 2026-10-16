/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import ContactForm from '@frontend/components/feedback/ContactForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('feedback');
  return { title: t('title'), description: t('subtitle') };
}

export default async function SupportPage() {
  const api = await getApi();
  const user = await api.authApi.getSessionUser();

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height)-200px)] flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <ContactForm initialEmail={user?.email || ''} />
      </div>
    </div>
  );
}
