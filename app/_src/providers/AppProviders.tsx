import { PropsWithChildren, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/state/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import { StripeProvider } from '@stripe/stripe-react-native';

export function AppProviders({ children }: PropsWithChildren): ReactNode {
  const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider publishableKey={pk} urlScheme="arevo">
        <AuthProvider>{children}</AuthProvider>
      </StripeProvider>
    </QueryClientProvider>
  );
}
