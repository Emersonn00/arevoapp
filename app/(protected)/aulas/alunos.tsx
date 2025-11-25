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
import { ArrowLeft, User, Calendar, Phone } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Inscricao {
  id: string;
  nome_aluno: string;
  telefone_aluno: string;
  data_aula: string;
  data_inscricao: string;
  aulas: {
    titulo: string;
    horario: string;
    arenas: {
      nome: string;
    } | null;
  } | null;
}

export default function MyStudentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
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
      // Get all classes from this professor
      const { data: aulas, error: aulasError } = await supabase
        .from('aulas')
        .select('id')
        .eq('professor_id', user.id)
        .eq('ativo', true);

      if (aulasError) throw aulasError;

      if (!aulas || aulas.length === 0) {
        setInscricoes([]);
        setLoading(false);
        return;
      }

      const aulaIds = aulas.map((a) => a.id);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('inscricoes_aulas')
        .select(
          'id, nome_aluno, telefone_aluno, data_aula, data_inscricao, aulas (titulo, horario, arenas (nome))'
        )
        .in('aula_id', aulaIds)
        .gte('data_aula', today)
        .order('data_aula', { ascending: true })
        .order('data_inscricao', { ascending: true });

      if (error) throw error;
      setInscricoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error);
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
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const renderInscricao = ({ item }: { item: Inscricao }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.nome_aluno.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.nome_aluno}</Text>
          {item.aulas && (
            <Text style={styles.cardSubtitle}>{item.aulas.titulo}</Text>
          )}
        </View>
      </View>

      <View style={styles.cardInfo}>
        {item.aulas && (
          <View style={styles.infoRow}>
            <Calendar color="#6B7280" size={16} />
            <Text style={styles.infoText}>
              {formatDate(item.data_aula)} às {item.aulas.horario}
            </Text>
          </View>
        )}
        {item.aulas?.arenas && (
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{item.aulas.arenas.nome}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Phone color="#6B7280" size={16} />
          <Text style={styles.infoText}>{item.telefone_aluno}</Text>
        </View>
      </View>
    </View>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#111827" size={20} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meus Alunos</Text>
      </View>

      {inscricoes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <User color="#9CA3AF" size={48} />
          <Text style={styles.emptyText}>Nenhum aluno inscrito ainda</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    marginTop: 16,
    textAlign: 'center',
  },
});



