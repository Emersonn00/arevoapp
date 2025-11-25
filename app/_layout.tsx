import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { AppProviders } from '@/providers/AppProviders';
import { Loading } from '@/components/Loading';

// Suprimir warnings sobre arquivos em _src que não são rotas
LogBox.ignoreLogs([
  'Route "./_src/',
  'is missing the required default export',
]);

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(protected)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Usuário não logado e não está na área de auth
      // Redireciona para tabs (que mostrará login na tab de perfil)
      router.replace('/(tabs)/home');
    } else if (user && inAuthGroup) {
      // Usuário logado mas está na área de auth
      router.replace('/(tabs)/home');
    }
  }, [user, loading, segments]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(protected)" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}


