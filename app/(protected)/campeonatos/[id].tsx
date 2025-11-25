import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Trophy,
  Users,
  DollarSign,
  Clock,
  FileText,
  UserPlus,
} from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { Tables } from '@/services/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useAuth } from '@/hooks/useAuth';
import { isRegistrationOpen } from '@/lib/date';
import TournamentRegistrationModal from '@/features/campeonatos/components/TournamentRegistrationModal';

type Campeonato = Tables<'campeonatos'>;

interface Categoria {
  id: string;
  nome_categoria: string;
  categoria: string;
  nivel: string;
  limite_duplas: number;
}

export default function TournamentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Campeonato | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadTournament();
      loadCategorias();
    }
  }, [id]);

  const loadTournament = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('campeonatos')
        .select('*')
        .eq('id', id)
        .eq('ativo', true)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error: any) {
      console.error('Erro ao carregar campeonato:', error);
      Alert.alert('Erro', 'Campeonato não encontrado', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('categorias_campeonatos')
        .select('*')
        .eq('campeonato_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
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

  const formatDateRange = (start: string, end: string) => {
    if (start === end) return formatDate(start);
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const registrationOpen = tournament
    ? isRegistrationOpen(tournament.data_inicio_inscricoes, tournament.data_fim_inscricoes)
    : false;

  const handleContactWhatsApp = () => {
    if (!tournament?.telefone_contato) return;
    const cleanPhone = tournament.telefone_contato.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    });
  };

  const handleViewBracket = () => {
    router.push(`/(protected)/campeonatos/${id}/chaveamento`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Campeonato não encontrado</Text>
      </View>
    );
  }

  const isOwner = user?.id === tournament.user_id;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#111827" size={20} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      {tournament.foto_capa_url && (
        <Image source={{ uri: tournament.foto_capa_url }} style={styles.coverImage} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.nome}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tournament.tipo_campeonato === 'fechado' ? 'Fechado' : 'Aberto'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin color="#6B7280" size={16} />
            <Text style={styles.metaText}>
              {tournament.cidade}, {tournament.estado}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar color="#6B7280" size={16} />
            <Text style={styles.metaText}>
              {formatDateRange(tournament.data_inicio, tournament.data_fim)}
            </Text>
          </View>
        </View>

        {tournament.tipo_campeonato === 'fechado' && (
          <View style={styles.closedInfo}>
            <Text style={styles.closedText}>
              <Text style={styles.closedBold}>Campeonato Fechado:</Text> Restrito a alunos
              afiliados à arena ou que tiveram aulas nos últimos 2 meses antes do fim das
              inscrições.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Evento</Text>
          <View style={styles.infoItem}>
            <Calendar color="#1E3A8A" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data do Evento</Text>
              <Text style={styles.infoValue}>
                {formatDateRange(tournament.data_inicio, tournament.data_fim)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MapPin color="#1E3A8A" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Local</Text>
              <Text style={styles.infoValue}>{tournament.local_arena}</Text>
              <Text style={styles.infoSubValue}>
                {tournament.cidade}, {tournament.estado}
              </Text>
            </View>
          </View>

          {tournament.taxa_inscricao && (
            <View style={styles.infoItem}>
              <DollarSign color="#1E3A8A" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Taxa de Inscrição</Text>
                <Text style={styles.infoValue}>
                  R$ {tournament.taxa_inscricao.toFixed(2)} por dupla
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cronograma</Text>
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleLabel}>Inscrições</Text>
              <View
                style={[
                  styles.statusBadge,
                  registrationOpen ? styles.statusOpen : styles.statusClosed,
                ]}
              >
                <Text style={styles.statusText}>
                  {registrationOpen ? 'Abertas' : 'Encerradas'}
                </Text>
              </View>
            </View>
            <Text style={styles.scheduleValue}>
              {formatDateRange(tournament.data_inicio_inscricoes, tournament.data_fim_inscricoes)}
            </Text>
          </View>

          <View style={styles.scheduleItem}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleLabel}>Pagamento</Text>
              <View style={[styles.statusBadge, styles.statusOpen]}>
                <Text style={styles.statusText}>Disponível</Text>
              </View>
            </View>
            <Text style={styles.scheduleValue}>
              {formatDateRange(tournament.data_inicio_pagamento, tournament.data_fim_pagamento)}
            </Text>
          </View>
        </View>

        {tournament.regras && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText color="#1E3A8A" size={20} />
              <Text style={styles.sectionTitle}>Regras do Campeonato</Text>
            </View>
            <Text style={styles.rulesText}>{tournament.regras}</Text>
          </View>
        )}

        {categorias.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy color="#1E3A8A" size={20} />
              <Text style={styles.sectionTitle}>Categorias</Text>
            </View>
            {categorias.map((categoria) => (
              <View key={categoria.id} style={styles.categoryCard}>
                <Text style={styles.categoryName}>{categoria.nome_categoria}</Text>
                <View style={styles.categoryBadges}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{categoria.categoria}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{categoria.nivel}</Text>
                  </View>
                </View>
                <Text style={styles.categoryLimit}>
                  Máximo: {categoria.limite_duplas} duplas
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organização</Text>
          <View style={styles.infoItem}>
            <Users color="#1E3A8A" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Organizador</Text>
              <Text style={styles.infoValue}>{tournament.organizador}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Phone color="#1E3A8A" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contato</Text>
              <Text style={styles.infoValue}>{tournament.telefone_contato}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !registrationOpen && styles.buttonDisabled,
            ]}
            onPress={() => setShowRegistrationModal(true)}
            disabled={!registrationOpen}
          >
            <UserPlus color="#FFFFFF" size={20} />
            <Text style={styles.primaryButtonText}>
              {registrationOpen ? 'Inscrever-se' : 'Inscrições Encerradas'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContactWhatsApp}
          >
            <Phone color="#1E3A8A" size={20} />
            <Text style={styles.secondaryButtonText}>Entrar em Contato</Text>
          </TouchableOpacity>

          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleViewBracket}
              >
                <Trophy color="#1E3A8A" size={20} />
                <Text style={styles.secondaryButtonText}>Ver Chaveamento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push(`/(protected)/campeonatos/${id}/inscritos`)}
              >
                <Users color="#1E3A8A" size={20} />
                <Text style={styles.secondaryButtonText}>Gerenciar Inscritos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push(`/(protected)/campeonatos/${id}/editar`)}
              >
                <Text style={styles.secondaryButtonText}>Editar Campeonato</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <TournamentRegistrationModal
        visible={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        tournament={tournament}
        categories={categorias}
        onSuccess={() => {
          setShowRegistrationModal(false);
          Alert.alert('Sucesso', 'Inscrição realizada com sucesso!');
        }}
      />
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
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  closedInfo: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  closedText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  closedBold: {
    fontWeight: '700',
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
  scheduleItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  scheduleValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#D1FAE5',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  rulesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  categoryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  categoryBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  categoryLimit: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
});

