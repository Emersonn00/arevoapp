import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase/client';
import { Tables } from '@/services/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

type Campeonato = Tables<'campeonatos'>;

export default function CampeonatosScreen() {
  const router = useRouter();
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCampeonatos();
  }, []);

  async function loadCampeonatos() {
    try {
      const { data, error } = await supabase
        .from('campeonatos')
        .select('*')
        .eq('ativo', true)
        .order('data_inicio', { ascending: true });

      if (error) throw error;

      setCampeonatos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar campeonatos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadCampeonatos();
  }

  function formatDate(dateString: string) {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  }

  function renderCampeonato({ item }: { item: Campeonato }) {
    const inscricoesAbertas = item.inscricoes_abertas;
    const hoje = new Date();
    const dataFimInscricoes = new Date(item.data_fim_inscricoes);
    const inscricoesEncerradas = hoje > dataFimInscricoes;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          router.push(`/(protected)/campeonatos/${item.id}`);
        }}
      >
        {item.foto_capa_url && (
          <Image source={{ uri: item.foto_capa_url }} style={styles.cardImage} />
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <View
              style={[
                styles.badge,
                inscricoesAbertas && !inscricoesEncerradas
                  ? styles.badgeOpen
                  : styles.badgeClosed,
              ]}
            >
              <Text style={styles.badgeText}>
                {inscricoesAbertas && !inscricoesEncerradas
                  ? 'Inscrições Abertas'
                  : 'Inscrições Encerradas'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardOrganizador}>Organizado por: {item.organizador}</Text>

          <View style={styles.cardInfo}>
            <Text style={styles.cardInfoText}>
              📍 {item.local_arena} - {item.cidade}, {item.estado}
            </Text>
            <Text style={styles.cardInfoText}>
              📅 Início: {formatDate(item.data_inicio)}
            </Text>
            <Text style={styles.cardInfoText}>
              📅 Fim: {formatDate(item.data_fim)}
            </Text>
            {item.taxa_inscricao && (
              <Text style={styles.cardInfoText}>
                💰 Taxa: R$ {item.taxa_inscricao.toFixed(2)}
              </Text>
            )}
            {item.max_equipes && (
              <Text style={styles.cardInfoText}>
                👥 Máximo de equipes: {item.max_equipes}
              </Text>
            )}
          </View>

          {item.regras && (
            <Text style={styles.cardRegras} numberOfLines={2}>
              {item.regras}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Campeonatos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campeonatos</Text>
      </View>

      {campeonatos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum campeonato disponível no momento.
          </Text>
        </View>
      ) : (
        <FlatList
          data={campeonatos}
          renderItem={renderCampeonato}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeOpen: {
    backgroundColor: '#E8F5E9',
  },
  badgeClosed: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  cardOrganizador: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardInfo: {
    marginBottom: 12,
  },
  cardInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  cardRegras: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});






