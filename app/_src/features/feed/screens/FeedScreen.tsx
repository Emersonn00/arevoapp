import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { FeedComposer } from '../components/FeedComposer';
import { FeedPostCard } from '../components/FeedPostCard';
import { FeedActivityCard } from '../components/FeedActivityCard';
import { useCommunityFeed } from '../hooks/useCommunityFeed';

export default function FeedScreen(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const {
    data: activities = [],
    isLoading,
    refetch,
  } = useCommunityFeed(user?.id);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Entre na sua conta para acessar o feed.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Feed da Comunidade</Text>
      <FeedComposer onPostCreated={refetch} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2563EB" />
      ) : activities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Sem atividades ainda. Siga atletas para acompanhar o que estão fazendo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) =>
            item.type === 'post' ? (
              <FeedPostCard activity={item} />
            ) : (
              <FeedActivityCard activity={item} />
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 32,
  },
  empty: {
    marginTop: 32,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
  },
});


