import type { ReactNode } from 'react';
import { useSession } from '../features/access/SessionProvider';
export function RoleGate({ children }: { children: ReactNode }) {
  return useSession().session?.role === 'owner' ? children : null;
}
