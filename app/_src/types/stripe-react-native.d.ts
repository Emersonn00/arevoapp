declare module '@stripe/stripe-react-native' {
  export const StripeProvider: any;
  export function useStripe(): {
    initPaymentSheet: (options: any) => Promise<{ error?: any }>;
    presentPaymentSheet: (options?: any) => Promise<{ error?: any }>;
  };
}

