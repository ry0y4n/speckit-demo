'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserResponse } from '@/types';

type CurrentUserContextValue = {
  currentUser: UserResponse | null;
  setCurrentUser: (user: UserResponse | null) => void;
  isSelected: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserResponse | null>(null);

  const setCurrentUser = useCallback((user: UserResponse | null) => {
    setCurrentUserState(user);
  }, []);

  return (
    <CurrentUserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isSelected: currentUser !== null,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
}
