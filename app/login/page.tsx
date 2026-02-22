'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import LoginForm from '@/frontend/components/LoginForm';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function LoginPage() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();

  // If already logged in, push to Dashboard
  useEffect(() => {
    if (currentUser) {
      router.push('/characters');
    }
  }, [currentUser, router]);

  if (currentUser) {
    return null;
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push('/')}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          &larr; Voltar
        </button>
      </div>
      <LoginForm />
    </div>
  );
}
