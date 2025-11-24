import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPin, Search } from 'lucide-react-native';
import { Json } from '@/services/supabase/types';
import { supabase } from '@/services/supabase/client';
import { useRouter } from 'expo-router';

interface Arena {
  id: string;
  nome: string;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  descricao: string | null;
  fotos: Json | null;
}

interface ArenaSearchSectionProps {
  limit?: number;
  enableSearch?: boolean;
  showSeeAllLink?: boolean;
}

export function ArenaSearchSection({
  limit = 3,
  enableSearch = true,
  showSeeAllLink = false,
}: ArenaSearchSectionProps): JSX.Element {
  const router = useRouter();
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadArenas = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('arenas')
      .select('id, nome, endereco_bairro, endereco_cidade, descricao, fotos')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (!error && data) {
      setArenas(data);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    loadArenas();
  }, [loadArenas]);

  const filteredArenas = useMemo(() => {
    if (!searchTerm) {
      return arenas;
    }
    const lowerTerm = searchTerm.toLowerCase();
    return arenas.filter((arena) =>
      [arena.nome, arena.endereco_cidade, arena.endereco_bairro]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(lowerTerm)),
    );
  }, [arenas, searchTerm]);

  const renderArenaCard = ({ item }: { item: Arena }) => {
    const photos = extractPhotos(item.fotos);
    const description = item.descricao ?? 'Arena parceira Arevo';

    return (
      <View style={styles.card}>
        {photos.length > 0 ? (
          <Image source={{ uri: photos[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImageFallback]}>
            <Text style={styles.cardImageFallbackText}>Sem fotos</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          <View style={styles.locationRow}>
            <MapPin color="#6B7280" size={16} />
            <Text style={styles.locationText}>
              {[item.endereco_bairro, item.endereco_cidade].filter(Boolean).join(', ')}
            </Text>
          </View>
          <Text style={styles.cardDescription}>{truncate(description, 120)}</Text>
          <Pressable
            style={styles.cardButton}
            onPress={() => router.push(`/(protected)/arenas/${item.id}`)}
          >
            <Text style={styles.cardButtonText}>Ver mais</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Arenas Parceiras</Text>
      <View style={styles.headerRow}>
        <Text style={styles.sectionSubtitle}>Encontre as melhores quadras de futevôlei</Text>
        {showSeeAllLink && (
          <Pressable onPress={() => router.push('/(protected)/arenas')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </Pressable>
        )}
      </View>

      {enableSearch && (
        <View style={styles.searchInputWrapper}>
          <Search color="#9CA3AF" size={16} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar por nome da arena ou cidade..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
      ) : filteredArenas.length === 0 ? (
        <Text style={styles.emptyState}>Nenhuma arena encontrada.</Text>
      ) : (
        <FlatList
          data={filteredArenas}
          renderItem={renderArenaCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const extractPhotos = (fotos: Json | null): string[] => {
  if (Array.isArray(fotos)) {
    return fotos
      .map((foto) => {
        if (typeof foto === 'string') return foto;
        if (typeof foto === 'object' && foto !== null && 'url' in foto) {
          return (foto as { url: string }).url;
        }
        return null;
      })
      .filter((url): url is string => Boolean(url));
  }
  return [];
};

const truncate = (text: string, max = 80) => {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  searchInputWrapper: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  listContent: {
    marginTop: 24,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cardImageFallbackText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
  },
  cardButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyState: {
    marginTop: 32,
    textAlign: 'center',
    color: '#6B7280',
  },
});

