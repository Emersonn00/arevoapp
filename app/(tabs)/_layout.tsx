import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Home, Trophy, PlusCircle, User, LogIn, MapPin } from 'lucide-react-native';

export default function TabLayout(): JSX.Element {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campeonatos"
        options={{
          title: 'Campeonatos',
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="arenas"
        options={{
          title: 'Arenas',
          tabBarIcon: ({ color, size }) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="criar-campeonato"
        options={{
          title: 'Criar',
          tabBarIcon: ({ color, size }) => (
            <PlusCircle size={size} color={color} />
          ),
          href: user ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: user ? 'Perfil' : 'Entrar',
          tabBarIcon: ({ color, size }) =>
            user ? (
              <User size={size} color={color} />
            ) : (
              <LogIn size={size} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}


