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

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Ocorreu um erro inesperado na autenticação.';
  const t = useTranslations('common');

  return (
    <div className="bg-background flex flex-1 items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-sm border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-red-400">Erro de Autenticação</CardTitle>
          <CardDescription className="text-gray-400">
            Não foi possível completar a operação.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 py-6">
          <p className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-gray-300">
            {message}
          </p>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href="/login">{t('back')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
