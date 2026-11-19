import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import AuthLayout from '@frontend/components/auth/AuthLayout';
import { Button } from '@frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';
import { translateErrorCode } from '@frontend/lib/error-message';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface AuthErrorPageProps {
  searchParams: SearchParams;
}

// Codes that mean "the link no longer works": the page suggests requesting a new one
const EXPIRED_LINK_CODES = new Set(['no_code_provided', 'auth_error_link_expired']);

// Where to ask for another link, by the type of the e-mail link (/api/auth/confirm sends it). The
// sign-in page sends a magic link, which also confirms an account.
const NEW_LINK_PAGES: Record<string, string> = {
  recovery: '/forgot-password',
  signup: '/login',
  magiclink: '/login',
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function readError(searchParams: SearchParams) {
  const params = await searchParams;
  const code = first(params.message) ?? null;
  const type = first(params.type);
  return {
    code,
    isExpiredLink: EXPIRED_LINK_CODES.has(code ?? ''),
    newLinkPage: type && Object.hasOwn(NEW_LINK_PAGES, type) ? NEW_LINK_PAGES[type] : undefined,
  };
}

export async function generateMetadata({ searchParams }: AuthErrorPageProps): Promise<Metadata> {
  const t = await getTranslations('common');
  const { isExpiredLink } = await readError(searchParams);
  return { title: isExpiredLink ? t('errors.expired_link_title') : t('errors.auth_error_title') };
}

/** Where a sign-in or e-mail link that failed lands (`?message=<code>&type=<link type>`). */
export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const t = await getTranslations('common');
  const tAuth = await getTranslations('auth');
  const { code, isExpiredLink, newLinkPage } = await readError(searchParams);
  const errorMessage = translateErrorCode(t, code);

  return (
    <AuthLayout>
      <Card className="bg-card/80 mx-auto w-full max-w-sm shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle as="h1">
            {isExpiredLink ? t('errors.expired_link_title') : t('errors.auth_error_title')}
          </CardTitle>
          <CardDescription>
            {isExpiredLink ? errorMessage : t('errors.auth_error_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!isExpiredLink && (
            <p className="border-danger-muted bg-danger-surface text-foreground mb-1 rounded-md border p-3 text-center text-sm">
              {errorMessage}
            </p>
          )}
          {newLinkPage && (
            <Button asChild className="w-full">
              <Link href={newLinkPage}>{tAuth('requestNewLink')}</Link>
            </Button>
          )}
          {newLinkPage !== '/login' && (
            <Button asChild variant={newLinkPage ? 'ghost' : 'default'} className="w-full">
              <Link href="/login">{tAuth('toLogin')}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
