import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase/client';
import { Json } from '@/services/supabase/types';
import { ArenaCard } from '../components/ArenaCard';

interface ArenaListItem {
  id: string;
  nome: string;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  descricao: string | null;
  fotos: Json | null;
}

export default function ArenasScreen(): JSX.Element {
  const router = useRouter();
  const [arenas, setArenas] = useState<ArenaListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadArenas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('arenas')
      .select('id, nome, endereco_bairro, endereco_cidade, descricao, fotos')
      .eq('ativo', true)
      .order('nome', { ascending: true });
    if (!error && data) {
      setArenas(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadArenas();
  }, [loadArenas]);

  const filtered = useMemo(() => {
    const normalized = search.toLowerCase();
    if (!normalized) return arenas;
    return arenas.filter((arena) =>
      [arena.nome, arena.endereco_bairro, arena.endereco_cidade]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [arenas, search]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar Arenas</Text>
      <Text style={styles.subtitle}>Descubra quadras em todo o Brasil</Text>

      <View style={styles.searchInputWrapper}>
        <Search color="#9CA3AF" size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, bairro ou cidade"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ArenaCard {...item} onPress={(id) => router.push(`/(protected)/arenas/${id}`)} />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#6B7280',
  },
  searchInputWrapper: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    marginTop: 24,
    paddingBottom: 24,
  },
});


