'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@/types/user';
import { getOrCreateUser } from '@/backend/store/memory-store';

interface UserContextValue {
  currentUser: User | null;
  login: (username: string, displayName?: string) => User;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = useCallback((username: string, displayName?: string) => {
    const user = getOrCreateUser(username.trim(), displayName?.trim());
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ currentUser, login, logout }),
    [currentUser, login, logout]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within UserProvider');
  }
  return ctx;
}
