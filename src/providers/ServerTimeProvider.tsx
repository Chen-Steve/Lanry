'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useServerTime } from '@/hooks/useServerTime';

interface ServerTimeContextValue {
  getServerTime: () => Date;
  isServerTimeLoaded: boolean;
}

const ServerTimeContext = createContext<ServerTimeContextValue | null>(null);

export function ServerTimeProvider({ children }: { children: ReactNode }) {
  const { serverTime, isServerTimeLoaded } = useServerTime();

  return (
    <ServerTimeContext.Provider 
      value={{ 
        getServerTime: serverTime,
        isServerTimeLoaded,
      }}
    >
      {children}
    </ServerTimeContext.Provider>
  );
}

export function useServerTimeContext() {
  const context = useContext(ServerTimeContext);
  if (!context) {
    throw new Error('useServerTimeContext must be used within a ServerTimeProvider');
  }
  return context;
} 