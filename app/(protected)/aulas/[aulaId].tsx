import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
} from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Linking } from 'react-native';

interface Aula {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  horario: string;
  duracao: number;
  nivel: string | null;
  tipo: string;
  max_alunos: number | null;
  preco: number | null;
  is_recorrente: boolean;
  dias_semana: string[] | null;
  aceita_totalpass: boolean;
  aceita_wellhub: boolean;
  professor_id: string;
  arena_id: string;
  arenas: {
    nome: string;
    endereco_cidade: string | null;
    telefone: string | null;
  } | null;
}

interface Inscricao {
  id: string;
  nome_aluno: string;
  telefone_aluno: string;
  data_inscricao: string;
}

export default function ClassDetailsScreen(): JSX.Element {
  const router = useRouter();
  const { aulaId } = useLocalSearchParams<{ aulaId: string }>();
  const { user } = useAuth();
  const [aula, setAula] = useState<Aula | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (aulaId) {
      loadAula(aulaId as string);
      loadInscricoes(aulaId as string);
    }
  }, [aulaId]);

  const loadAula = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('aulas')
        .select(
          'id, titulo, descricao, data, horario, duracao, nivel, tipo, max_alunos, preco, is_recorrente, dias_semana, aceita_totalpass, aceita_wellhub, professor_id, arena_id, arenas (nome, endereco_cidade, telefone)'
        )
        .eq('id', id)
        .eq('ativo', true)
        .single();

      if (error) throw error;
      if (data) {
        setAula({ ...(data as any), is_recorrente: !!(data as any)?.is_recorrente });
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Aula não encontrada', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadInscricoes = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('inscricoes_aulas')
        .select('id, nome_aluno, telefone_aluno, data_inscricao')
        .eq('aula_id', id)
        .order('data_inscricao', { ascending: false });

      if (error) throw error;
      setInscricoes(data || []);
    } catch (error) {}
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

  const formatDaysOfWeek = (days: string[] | null) => {
    if (!days || days.length === 0) return '';
    const dayMap: Record<string, string> = {
      domingo: 'Dom',
      segunda: 'Seg',
      terca: 'Ter',
      quarta: 'Qua',
      quinta: 'Qui',
      sexta: 'Sex',
      sabado: 'Sáb',
    };
    return days.map((d) => dayMap[d.toLowerCase()] || d).join(', ');
  };

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `tel:${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível fazer a ligação');
    });
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isOwner = false;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!aula) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Aula não encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#111827" size={20} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{aula.titulo}</Text>
          
        </View>

        <View style={styles.section}>
          <View style={styles.infoItem}>
            <Calendar color="#1E3A8A" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data</Text>
              <Text style={styles.infoValue}>
                {aula.is_recorrente
                  ? `Recorrente - ${formatDaysOfWeek(aula.dias_semana)}`
                  : formatDate(aula.data)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Clock color="#1E3A8A" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Horário</Text>
              <Text style={styles.infoValue}>
                {aula.horario} ({aula.duracao} minutos)
              </Text>
            </View>
          </View>

          {aula.arenas && (
            <View style={styles.infoItem}>
              <MapPin color="#1E3A8A" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Local</Text>
                <Text style={styles.infoValue}>{aula.arenas.nome}</Text>
                {aula.arenas.endereco_cidade && (
                  <Text style={styles.infoSubValue}>{aula.arenas.endereco_cidade}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.infoItem}>
            <Users color="#1E3A8A" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vagas</Text>
              <Text style={styles.infoValue}>
                {inscricoes.length}/{aula.max_alunos || '—'} alunos
              </Text>
            </View>
          </View>

          {aula.preco && (
            <View style={styles.infoItem}>
              <DollarSign color="#1E3A8A" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Preço</Text>
                <Text style={styles.infoValue}>R$ {aula.preco.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        
      </View>
    </ScrollView>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  editButtonText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
  },
  infoSubValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  studentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
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
    fontSize: 18,
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  studentDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  actionButtonText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
