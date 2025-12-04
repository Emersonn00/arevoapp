import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Globe, Instagram, MapPin, Phone } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { Json } from '@/services/supabase/types';
import { ArenaGallery } from '../components/ArenaGallery';

interface ArenaDetail {
  id: string;
  nome: string;
  descricao: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_cep: string | null;
  telefone: string | null;
  instagram: string | null;
  website: string | null;
  fotos: Json | null;
  horario_funcionamento: Json | null;
}

interface ArenaClass {
  id: string;
  titulo: string;
  horario: string;
  data: string;
  nivel: string | null;
  max_alunos: number | null;
}

export default function ArenaDetailsScreen() {
  const router = useRouter();
  const { arenaId } = useLocalSearchParams<{ arenaId: string }>();

  const [arena, setArena] = useState<ArenaDetail | null>(null);
  const [classes, setClasses] = useState<ArenaClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (arenaId) {
      loadArena(arenaId as string);
      loadClasses(arenaId as string);
    }
  }, [arenaId]);

  const loadArena = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('arenas')
      .select(
        'id, nome, descricao, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_cep, telefone, instagram, website, fotos, horario_funcionamento',
      )
      .eq('id', id)
      .single();
    if (!error && data) {
      setArena(data);
    }
    setLoading(false);
  };

  const loadClasses = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('aulas')
      .select('id, titulo, horario, data, nivel, max_alunos')
      .eq('arena_id', id)
      .eq('ativo', true)
      .gte('data', today)
      .order('data', { ascending: true })
      .limit(6);
    if (!error && data) {
      setClasses(data);
    }
  };

  const formattedAddress = useMemo(() => {
    if (!arena) return '';
    return [
      arena.endereco_rua && `${arena.endereco_rua} ${arena.endereco_numero ?? ''}`.trim(),
      arena.endereco_bairro,
      arena.endereco_cidade,
      arena.endereco_cep ? `CEP ${arena.endereco_cep}` : null,
    ]
      .filter(Boolean)
      .join(', ');
  }, [arena]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!arena) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Arena não encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#111827" size={20} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </Pressable>

      <Text style={styles.title}>{arena.nome}</Text>
      <Text style={styles.address}>
        <MapPin size={16} color="#6B7280" /> {formattedAddress}
      </Text>

      <ArenaGallery fotos={arena.fotos} />

      {arena.descricao && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre a arena</Text>
          <Text style={styles.sectionText}>{arena.descricao}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contato</Text>
        {arena.telefone && (
          <Text style={styles.contactRow}>
            <Phone size={16} color="#6B7280" /> {arena.telefone}
          </Text>
        )}
        {arena.instagram && (
          <Text style={styles.contactRow}>
            <Instagram size={16} color="#6B7280" /> @{arena.instagram.replace('@', '')}
          </Text>
        )}
        {arena.website && (
          <Text style={styles.contactRow}>
            <Globe size={16} color="#6B7280" /> {arena.website}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximas aulas</Text>
        {classes.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma aula publicada para os próximos dias.</Text>
        ) : (
          classes.map((aula) => (
            <View key={aula.id} style={styles.classCard}>
              <Text style={styles.classTitle}>{aula.titulo}</Text>
              <Text style={styles.classMeta}>
                {formatDate(aula.data)} • {aula.horario}
              </Text>
              <Text style={styles.classMeta}>
                {aula.nivel ?? 'Nível livre'} • Máx. {aula.max_alunos ?? '—'} alunos
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push(`/(protected)/aulas/agendar?arenaId=${arena.id}`)}>
                <Text style={styles.primaryButtonText}>Agendar aula</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const formatDate = (date: string): string => {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return date;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  address: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  contactRow: {
    fontSize: 15,
    color: '#4B5563',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  classCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  classMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
});


