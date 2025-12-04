import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, Users, MapPin } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface InscricaoAulaItem {
  id: string;
  data_aula: string;
  aulas: {
    id: string;
    titulo: string;
    horario: string;
    duracao: number;
    nivel: string | null;
    max_alunos: number | null;
    arenas: {
      nome: string;
      endereco_cidade: string | null;
    } | null;
  } | null;
}

export default function MyClassesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [inscricoes, setInscricoes] = useState<InscricaoAulaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadInscricoes();
    }
  }, [user]);

  const loadInscricoes = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('inscricoes_aulas')
        .select(
          'id, data_aula, aulas ( id, titulo, horario, duracao, nivel, max_alunos, arenas (nome, endereco_cidade) )'
        )
        .eq('user_id', user.id)
        .gte('data_aula', today)
        .order('data_aula', { ascending: true });

      if (error) throw error;
      setInscricoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInscricoes();
  };

  const formatDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const renderInscricao = ({ item }: { item: InscricaoAulaItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => item.aulas?.id && router.push(`/(protected)/aulas/${item.aulas.id}`)}
    >
      <Text style={styles.cardTitle}>{item.aulas?.titulo}</Text>
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Calendar color="#6B7280" size={16} />
          <Text style={styles.infoText}>{formatDate(item.data_aula)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock color="#6B7280" size={16} />
          <Text style={styles.infoText}>{item.aulas?.horario}</Text>
        </View>
        {item.aulas?.arenas && (
          <View style={styles.infoRow}>
            <MapPin color="#6B7280" size={16} />
            <Text style={styles.infoText}>
              {item.aulas.arenas.nome}
              {item.aulas.arenas.endereco_cidade && ` - ${item.aulas.arenas.endereco_cidade}`}
            </Text>
          </View>
        )}
        {item.aulas?.max_alunos && (
          <View style={styles.infoRow}>
            <Users color="#6B7280" size={16} />
            <Text style={styles.infoText}>Máx. {item.aulas.max_alunos} alunos</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Aulas</Text>
      </View>

      {inscricoes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não tem aulas agendadas</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(protected)/aulas/agendar')}
          >
            <Text style={styles.emptyButtonText}>Agendar Aula</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={inscricoes}
          renderItem={renderInscricao}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  cardInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alunosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  alunosButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
  },
});
