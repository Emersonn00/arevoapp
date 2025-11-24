import { PropsWithChildren, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/state/queryClient';
import { AuthProvider } from '@/hooks/useAuth';

export function AppProviders({ children }: PropsWithChildren): ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
