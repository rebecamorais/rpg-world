'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';

import { getSupabaseBrowserClient } from '@lib/supabase-browser';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const handleSession = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }
      }

      // Then get the session (works for both code exchange result and hash fragment)
      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Fallback for hash fragments if getSession() fails to pick it up automatically
      if (!session && !sessionError && window.location.hash.includes('access_token')) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          session = setSessionData.session;
          sessionError = setSessionError;
        }
      }

      if (sessionError) {
        setError(sessionError.message);
        setTimeout(() => router.push('/login'), 3000);
      } else if (session) {
        router.push('/characters');
      } else {
        setError('Falha na confirmação ou link expirado.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleSession();
  }, [router]);

  return (
    <div className="bg-background flex flex-1 items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 font-medium text-white shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-center">
            {error ? 'Erro na Autenticação' : 'Confirmando...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          {!error ? (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          ) : (
            <p className="text-center text-red-400">{error}</p>
          )}
          <p className="text-center text-sm text-gray-400">
            {error
              ? 'Redirecionando para login...'
              : 'Aguarde um momento enquanto validamos seu acesso.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
