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
import { Plus, Calendar, Clock, Users, MapPin } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Aula {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  duracao: number;
  nivel: string | null;
  max_alunos: number | null;
  arena_id: string;
  arenas: {
    nome: string;
    endereco_cidade: string | null;
  } | null;
}

export default function MyClassesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAulas();
    }
  }, [user]);

  const loadAulas = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('aulas')
        .select(
          'id, titulo, data, horario, duracao, nivel, max_alunos, arena_id, arenas (nome, endereco_cidade)'
        )
        .eq('professor_id', user.id)
        .eq('ativo', true)
        .gte('data', today)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;
      setAulas(data || []);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAulas();
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

  const renderAula = ({ item }: { item: Aula }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(protected)/aulas/${item.id}`)}
    >
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Calendar color="#6B7280" size={16} />
          <Text style={styles.infoText}>{formatDate(item.data)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock color="#6B7280" size={16} />
          <Text style={styles.infoText}>{item.horario}</Text>
        </View>
        {item.arenas && (
          <View style={styles.infoRow}>
            <MapPin color="#6B7280" size={16} />
            <Text style={styles.infoText}>
              {item.arenas.nome}
              {item.arenas.endereco_cidade && ` - ${item.arenas.endereco_cidade}`}
            </Text>
          </View>
        )}
        {item.max_alunos && (
          <View style={styles.infoRow}>
            <Users color="#6B7280" size={16} />
            <Text style={styles.infoText}>Máx. {item.max_alunos} alunos</Text>
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(protected)/aulas/criar')}
        >
          <Plus color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>

      {aulas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma aula criada ainda</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(protected)/aulas/criar')}
          >
            <Text style={styles.emptyButtonText}>Criar Primeira Aula</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={aulas}
          renderItem={renderAula}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      
      <TouchableOpacity
        style={styles.alunosButton}
        onPress={() => router.push('/(protected)/aulas/alunos')}
      >
        <Users color="#1E3A8A" size={20} />
        <Text style={styles.alunosButtonText}>Ver Meus Alunos</Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
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

