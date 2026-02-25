'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/frontend/context/UserContext';

export default function AuthRedirect() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.push('/characters');
    }
  }, [currentUser, router]);

  return null;
}
