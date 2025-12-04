import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function ArenasScreen() {
  const router = useRouter();
  const [arenas, setArenas] = useState<ArenaListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableByArena, setAvailableByArena] = useState<Set<string>>(new Set());
  const [countsByArena, setCountsByArena] = useState<Record<string, number>>({});
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

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

  useEffect(() => {
    const loadAvailability = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('aulas')
        .select('arena_id, data')
        .eq('ativo', true)
        .gte('data', today);
      const set = new Set<string>();
      const counts: Record<string, number> = {};
      (data || []).forEach((row: { arena_id: string }) => {
        set.add(row.arena_id);
        counts[row.arena_id] = (counts[row.arena_id] || 0) + 1;
      });
      setAvailableByArena(set);
      setCountsByArena(counts);
    };
    loadAvailability();
  }, []);

  const filtered = useMemo(() => {
    const normalized = search.toLowerCase();
    if (!normalized) return arenas;
    return arenas.filter((arena) =>
      [arena.nome, arena.endereco_bairro, arena.endereco_cidade]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [arenas, search]);

  const distinctCities = useMemo(() => {
    return Array.from(new Set(arenas.map((a) => a.endereco_cidade).filter(Boolean))) as string[];
  }, [arenas]);

  const finalList = useMemo(() => {
    if (!selectedCity) return filtered;
    return filtered.filter((a) => a.endereco_cidade === selectedCity);
  }, [filtered, selectedCity]);

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

      {distinctCities.length > 0 && (
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            data={['Todas', ...distinctCities]}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Text
                onPress={() => setSelectedCity(item === 'Todas' ? null : item)}
                style={[
                  styles.filterChip,
                  (selectedCity === item || (item === 'Todas' && !selectedCity)) && styles.filterChipActive,
                ]}
              >
                {item}
              </Text>
            )}
            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
            contentContainerStyle={{ paddingVertical: 12 }}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={finalList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ArenaCard
              {...item}
              hasAvailability={availableByArena.has(item.id)}
              availabilityCount={countsByArena[item.id] || 0}
              onPress={(id) => router.push(`/(protected)/arenas/${id}`)}
            />
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
  filterRow: {
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#374151',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  filterChipActive: {
    borderColor: '#1E3A8A',
    color: '#1E3A8A',
    backgroundColor: '#EFF6FF',
    fontWeight: '700',
  },
});


