'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';
import { translateErrorCode } from '@frontend/lib/error-message';

// Codes that mean "the link no longer works": the page suggests requesting a new one
const EXPIRED_LINK_CODES = new Set(['no_code_provided', 'auth_error_link_expired']);

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('message');
  const t = useTranslations('common');

  const errorMessage = translateErrorCode(t, errorCode);
  const isExpiredLink = EXPIRED_LINK_CODES.has(errorCode ?? '');

  return (
    <div className="bg-background flex flex-1 items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-red-400">
            {isExpiredLink ? t('errors.expired_link_title') : t('errors.auth_error_title')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isExpiredLink
              ? t('errors.expired_link_description')
              : t('errors.auth_error_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 py-6">
          <p className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-gray-300">
            {errorMessage}
          </p>
          <Button asChild className="w-full">
            <Link href="/login">{t('back')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
