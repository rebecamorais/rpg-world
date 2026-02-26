'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { rpgWorldApi } from '@client';

import type { User } from '@/shared/types/user';

interface UserContextValue {
  currentUser: User | null;
  login: (username: string, displayName?: string) => Promise<User>;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = useCallback(async (username: string, displayName?: string) => {
    try {
      const user = await rpgWorldApi.post<User>('/api/auth/login', {
        username: username.trim(),
        displayName: displayName?.trim(),
      });
      setCurrentUser(user);
      return user;
    } catch (error: unknown) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ currentUser, login, logout }),
    [currentUser, login, logout],
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
