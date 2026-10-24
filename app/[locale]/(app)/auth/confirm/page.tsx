'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';

import { getSupabaseBrowserClient } from '@lib/supabase-browser';

export default function AuthConfirmPage() {
  const router = useRouter();
  const t = useTranslations('auth.confirm');
  const tCommon = useTranslations('common');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const handleSession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('Auth code exchange failed:', exchangeError);
          setFailed(true);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }
      }

      // Session tokens in the URL hash are deliberately not accepted: any page could put its own
      // there and log the visitor into that account. E-mail links go through /api/auth/confirm.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Auth session failed:', sessionError);
        setFailed(true);
        setTimeout(() => router.push('/login'), 3000);
      } else if (session) {
        router.push('/characters');
      } else {
        setFailed(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleSession();
  }, [router]);

  return (
    <div className="bg-background flex flex-1 items-center justify-center p-4">
      <Card className="bg-card/80 mx-auto w-full max-w-sm font-medium shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle as="h1" className="text-center">
            {failed ? t('errorTitle') : t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          {!failed ? (
            <div className="border-primary-flare h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
          ) : (
            <p className="text-danger-flare text-center">
              {tCommon('errors.expired_link_description')}
            </p>
          )}
          <p className="text-muted-foreground text-center text-sm">
            {failed ? t('redirecting') : t('waiting')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
