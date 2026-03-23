'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    // handles the hash fragment and establishes the session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
        setTimeout(() => router.push('/login'), 3000);
      } else if (session) {
        // Successful confirmation
        router.push('/characters');
      } else {
        // No session found after processing
        setError('Falha na confirmação ou link expirado.');
        setTimeout(() => router.push('/login'), 3000);
      }
    });
  }, [router]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
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
