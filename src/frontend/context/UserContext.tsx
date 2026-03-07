'use client';

import { type ReactNode, createContext, useContext, useMemo } from 'react';

import type { User } from '@shared/types/user';

interface UserContextValue {
  currentUser: User | null;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) {
  const value = useMemo<UserContextValue>(
    () => ({ currentUser: user }),
    [user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within UserProvider');
  }
  return ctx;
}
