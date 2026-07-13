import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@soft-habit/contracts';
import { createContext, useContext, type ReactNode } from 'react';
import { getSession } from './api';

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<unknown>;
};
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['session'], queryFn: getSession, retry: false });
  return (
    <SessionContext.Provider
      value={{
        session: query.data ?? null,
        loading: query.isLoading,
        refresh: () => client.invalidateQueries({ queryKey: ['session'] }),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used within SessionProvider');
  return value;
}
