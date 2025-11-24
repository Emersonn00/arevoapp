import { Stack } from 'expo-router';

export default function ProtectedLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}


