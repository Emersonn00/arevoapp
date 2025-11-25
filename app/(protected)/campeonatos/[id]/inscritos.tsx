import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Filter,
  Trash2,
  ArrowLeftRight,
  User,
  Phone,
} from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Inscription {
  id: string;
  categoria_id: string;
  status_inscricao: string;
  competidor1: {
    user_id: string;
    nome: string;
    telefone: string | null;
    tamanho_camisa: string | null;
  };
  competidor2: {
    user_id: string;
    nome: string;
    telefone: string | null;
    tamanho_camisa: string | null;
  };
  categoria: {
    nome_categoria: string;
    nivel: string;
  };
  created_at: string;
  status_pagamento: 'nao_pago' | 'parcial' | 'completo';
}

export default function TournamentInscriptionsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (id) {
      loadInscriptions();
      loadAllCategories();
    }
  }, [id]);

  const loadAllCategories = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('categorias_campeonatos')
        .select('id, nome_categoria, nivel')
        .eq('campeonato_id', id);

      if (error) throw error;
      setAllCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadInscriptions = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from('inscricoes_campeonatos')
        .select('id, categoria_id, competidor1_id, competidor2_id, created_at, status_pagamento, status_inscricao')
        .eq('campeonato_id', id);

      if (inscriptionsError) throw inscriptionsError;

      if (!inscriptionsData || inscriptionsData.length === 0) {
        setInscriptions([]);
        return;
      }

      const userIds = [
        ...new Set([
          ...inscriptionsData.map((i) => i.competidor1_id),
          ...inscriptionsData.map((i) => i.competidor2_id),
        ]),
      ];

      const categoryIds = [...new Set(inscriptionsData.map((i) => i.categoria_id))];

      const usersDataPromises = userIds.map(async (userId) => {
        const { data, error } = await supabase.rpc('get_tournament_competitor_info', {
          target_user_id: userId,
          tournament_id: id,
        });

        if (error) {
          console.error('Erro ao buscar dados do competidor:', error);
          return null;
        }

        return data?.[0] || null;
      });

      const usersDataResults = await Promise.all(usersDataPromises);
      const usersData = usersDataResults.filter((user) => user !== null);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias_campeonatos')
        .select('id, nome_categoria, nivel')
        .in('id', categoryIds);

      if (categoriesError) throw categoriesError;

      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.user_id] = user;
        return acc;
      }, {} as any);

      const categoriesMap = (categoriesData || []).reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {} as any);

      const combinedData = inscriptionsData.map((inscription) => ({
        id: inscription.id,
        categoria_id: inscription.categoria_id,
        status_inscricao: inscription.status_inscricao || 'ativa',
        created_at: inscription.created_at,
        status_pagamento:
          (inscription.status_pagamento as 'nao_pago' | 'parcial' | 'completo') || 'nao_pago',
        competidor1: usersMap[inscription.competidor1_id] || {
          user_id: inscription.competidor1_id,
          nome: 'Usuário não encontrado',
          telefone: null,
          tamanho_camisa: null,
        },
        competidor2: usersMap[inscription.competidor2_id] || {
          user_id: inscription.competidor2_id,
          nome: 'Usuário não encontrado',
          telefone: null,
          tamanho_camisa: null,
        },
        categoria: categoriesMap[inscription.categoria_id] || {
          nome_categoria: 'Categoria não encontrada',
          nivel: '',
        },
      }));

      setInscriptions(combinedData);
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error);
      Alert.alert('Erro', 'Erro ao carregar inscrições');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveInscription = async (inscriptionId: string) => {
    Alert.alert('Confirmar exclusão', 'Tem certeza que deseja remover esta inscrição?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('inscricoes_campeonatos')
              .delete()
              .eq('id', inscriptionId);

            if (error) throw error;

            Alert.alert('Sucesso', 'Inscrição removida com sucesso');
            loadInscriptions();
          } catch (error: any) {
            console.error('Erro ao remover inscrição:', error);
            Alert.alert('Erro', error.message || 'Erro ao remover inscrição');
          }
        },
      },
    ]);
  };

  const handleCategoryChange = async (inscriptionId: string, newCategoryId: string) => {
    try {
      const { error } = await supabase
        .from('inscricoes_campeonatos')
        .update({ categoria_id: newCategoryId })
        .eq('id', inscriptionId);

      if (error) throw error;

      const category = allCategories.find((c) => c.id === newCategoryId);
      Alert.alert('Sucesso', `Categoria alterada para: ${category?.nome_categoria} - ${category?.nivel}`);
      loadInscriptions();
    } catch (error: any) {
      console.error('Erro ao alterar categoria:', error);
      Alert.alert('Erro', error.message || 'Erro ao alterar categoria');
    }
  };

  const handlePaymentStatusChange = async (
    inscriptionId: string,
    newStatus: 'nao_pago' | 'parcial' | 'completo'
  ) => {
    try {
      const { error } = await supabase
        .from('inscricoes_campeonatos')
        .update({
          status_pagamento: newStatus,
          pagamento_confirmado: newStatus === 'completo',
        })
        .eq('id', inscriptionId);

      if (error) throw error;

      const statusLabels = {
        nao_pago: 'Não pago',
        parcial: 'Pagamento parcial',
        completo: 'Pagamento completo',
      };

      Alert.alert('Sucesso', `Status alterado para: ${statusLabels[newStatus]}`);
      loadInscriptions();
    } catch (error: any) {
      console.error('Erro ao atualizar status do pagamento:', error);
      Alert.alert('Erro', error.message || 'Erro ao atualizar status do pagamento');
    }
  };

  const uniqueCategories = useMemo(() => {
    const categories = inscriptions.map((inscription) => ({
      id: inscription.categoria_id,
      name: `${inscription.categoria.nome_categoria} - ${inscription.categoria.nivel}`,
    }));
    const unique = categories.filter(
      (category, index, self) => index === self.findIndex((c) => c.id === category.id)
    );
    return unique;
  }, [inscriptions]);

  const filteredInscriptions = useMemo(() => {
    if (selectedCategory === 'all') {
      return inscriptions;
    }
    return inscriptions.filter((inscription) => inscription.categoria_id === selectedCategory);
  }, [inscriptions, selectedCategory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return { color: '#10B981', text: 'Aprovada' };
      case 'pendente_aprovacao':
        return { color: '#F59E0B', text: 'Pendente' };
      case 'rejeitada':
        return { color: '#EF4444', text: 'Rejeitada' };
      default:
        return { color: '#6B7280', text: 'Desconhecido' };
    }
  };

  const getPaymentBadge = (status: 'nao_pago' | 'parcial' | 'completo') => {
    switch (status) {
      case 'completo':
        return { color: '#10B981', text: 'Completo' };
      case 'parcial':
        return { color: '#F59E0B', text: 'Parcial' };
      default:
        return { color: '#6B7280', text: 'Não Pago' };
    }
  };

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
        <View style={styles.headerContent}>
          <Users color="#1E3A8A" size={24} />
          <Text style={styles.title}>Inscritos no Campeonato</Text>
        </View>
      </View>

      {inscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users color="#9CA3AF" size={48} />
          <Text style={styles.emptyText}>Nenhuma inscrição encontrada</Text>
        </View>
      ) : (
        <>
          <View style={styles.filters}>
            <View style={styles.filterRow}>
              <Filter color="#6B7280" size={20} />
              <Text style={styles.filterLabel}>Filtrar por categoria:</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
              <TouchableOpacity
                style={[styles.categoryTab, selectedCategory === 'all' && styles.categoryTabActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === 'all' && styles.categoryTabTextActive,
                  ]}
                >
                  Todas ({inscriptions.length})
                </Text>
              </TouchableOpacity>
              {uniqueCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category.id && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === category.id && styles.categoryTabTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredInscriptions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const statusBadge = getStatusBadge(item.status_inscricao);
              const paymentBadge = getPaymentBadge(item.status_pagamento);

              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[styles.statusBadge, { backgroundColor: `${statusBadge.color}20` }]}
                    >
                      <Text style={[styles.statusText, { color: statusBadge.color }]}>
                        {statusBadge.text}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleRemoveInscription(item.id)}
                    >
                      <Trash2 color="#DC2626" size={20} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Categoria:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {allCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryOption,
                            item.categoria_id === cat.id && styles.categoryOptionSelected,
                          ]}
                          onPress={() => handleCategoryChange(item.id, cat.id)}
                        >
                          <Text
                            style={[
                              styles.categoryOptionText,
                              item.categoria_id === cat.id && styles.categoryOptionTextSelected,
                            ]}
                          >
                            {cat.nome_categoria} - {cat.nivel}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.competitors}>
                    <View style={styles.competitor}>
                      <User color="#1E3A8A" size={20} />
                      <View style={styles.competitorInfo}>
                        <Text style={styles.competitorName}>{item.competidor1.nome}</Text>
                        {item.competidor1.telefone && (
                          <Text style={styles.competitorPhone}>{item.competidor1.telefone}</Text>
                        )}
                        {item.competidor1.tamanho_camisa && (
                          <Text style={styles.competitorShirt}>
                            Camisa: {item.competidor1.tamanho_camisa}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.competitor}>
                      <User color="#1E3A8A" size={20} />
                      <View style={styles.competitorInfo}>
                        <Text style={styles.competitorName}>{item.competidor2.nome}</Text>
                        {item.competidor2.telefone && (
                          <Text style={styles.competitorPhone}>{item.competidor2.telefone}</Text>
                        )}
                        {item.competidor2.tamanho_camisa && (
                          <Text style={styles.competitorShirt}>
                            Camisa: {item.competidor2.tamanho_camisa}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Status Pagamento:</Text>
                    <View style={styles.paymentOptions}>
                      {(['nao_pago', 'parcial', 'completo'] as const).map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.paymentOption,
                            item.status_pagamento === status && styles.paymentOptionSelected,
                          ]}
                          onPress={() => handlePaymentStatusChange(item.id, status)}
                        >
                          <Text
                            style={[
                              styles.paymentOptionText,
                              item.status_pagamento === status && styles.paymentOptionTextSelected,
                            ]}
                          >
                            {getPaymentBadge(status).text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  filters: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryTabs: {
    marginTop: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTabTextActive: {
    color: '#1E3A8A',
  },
  list: {
    padding: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryOptionTextSelected: {
    color: '#1E3A8A',
  },
  competitors: {
    gap: 12,
    marginBottom: 16,
  },
  competitor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  competitorInfo: {
    flex: 1,
  },
  competitorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  competitorPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  competitorShirt: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  paymentOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  paymentOptionTextSelected: {
    color: '#1E3A8A',
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



