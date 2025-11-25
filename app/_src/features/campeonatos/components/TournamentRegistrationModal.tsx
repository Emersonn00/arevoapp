import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { X, Search, User } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { Tables } from '@/services/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type Campeonato = Tables<'campeonatos'>;

interface Categoria {
  id: string;
  nome_categoria: string;
  categoria: string;
  nivel: string;
}

interface UserProfile {
  user_id: string;
  nome: string;
  avatar_url: string | null;
}

interface TournamentRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  tournament: Campeonato;
  categories: Categoria[];
  onSuccess?: () => void;
}

export default function TournamentRegistrationModal({
  visible,
  onClose,
  tournament,
  categories,
  onSuccess,
}: TournamentRegistrationModalProps) {
  const { user } = useAuth();
  const [competidor1, setCompetidor1] = useState<UserProfile | null>(null);
  const [competidor2, setCompetidor2] = useState<UserProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');
  const [searchResults1, setSearchResults1] = useState<UserProfile[]>([]);
  const [searchResults2, setSearchResults2] = useState<UserProfile[]>([]);
  const [searching1, setSearching1] = useState(false);
  const [searching2, setSearching2] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setCompetidor1(null);
      setCompetidor2(null);
      setSelectedCategory('');
      setSearchQuery1('');
      setSearchQuery2('');
      setSearchResults1([]);
      setSearchResults2([]);
    }
  }, [visible]);

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, avatar_url')
        .neq('user_id', user?.id || '')
        .ilike('nome', `%${query}%`)
        .limit(20);

      if (error) throw error;

      return (
        data?.map((p) => ({
          user_id: p.user_id,
          nome: p.nome || 'Usuário',
          avatar_url: p.avatar_url,
        })) || []
      );
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery1.length >= 2) {
        setSearching1(true);
        const results = await searchUsers(searchQuery1);
        setSearchResults1(results);
        setSearching1(false);
      } else {
        setSearchResults1([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery1]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery2.length >= 2) {
        setSearching2(true);
        const results = await searchUsers(searchQuery2);
        setSearchResults2(results);
        setSearching2(false);
      } else {
        setSearchResults2([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery2]);

  const handleSubmit = async () => {
    if (!user || !competidor1 || !competidor2 || !selectedCategory) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (competidor1.user_id === competidor2.user_id) {
      Alert.alert('Erro', 'Os dois competidores devem ser diferentes');
      return;
    }

    // Check if registration is still open
    const now = new Date();
    const start = new Date(tournament.data_inicio_inscricoes);
    const end = new Date(tournament.data_fim_inscricoes);
    end.setHours(23, 59, 59);

    if (now < start || now > end) {
      Alert.alert('Inscrições Encerradas', 'O período de inscrições já foi encerrado');
      onClose();
      return;
    }

    // Check eligibility for closed tournaments
    if (tournament.tipo_campeonato === 'fechado') {
      try {
        const { data: eligible1, error: error1 } = await supabase.rpc(
          'is_eligible_for_closed_tournament',
          {
            p_user_id: competidor1.user_id,
            p_tournament_id: tournament.id,
          }
        );

        const { data: eligible2, error: error2 } = await supabase.rpc(
          'is_eligible_for_closed_tournament',
          {
            p_user_id: competidor2.user_id,
            p_tournament_id: tournament.id,
          }
        );

        if (error1 || error2) {
          Alert.alert('Erro', 'Erro ao verificar elegibilidade dos competidores');
          return;
        }

        if (!eligible1 || !eligible2) {
          const ineligibleName = !eligible1 ? competidor1.nome : competidor2.nome;
          Alert.alert(
            'Campeonato Fechado',
            `${ineligibleName} não é elegível para este campeonato. Este é um campeonato fechado para alunos afiliados à arena ou que tiveram aulas nos últimos 2 meses.`
          );
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar elegibilidade:', error);
        Alert.alert('Erro', 'Erro ao verificar elegibilidade dos competidores');
        return;
      }
    }

    setLoading(true);

    try {
      const needsApproval =
        user.id !== competidor1.user_id || user.id !== competidor2.user_id;
      const status = needsApproval ? 'pendente_aprovacao' : 'ativa';

      const { error } = await supabase.from('inscricoes_campeonatos').insert({
        campeonato_id: tournament.id,
        categoria_id: selectedCategory,
        competidor1_id: competidor1.user_id,
        competidor2_id: competidor2.user_id,
        inscrito_por_id: user.id,
        status_inscricao: status,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Erro', 'Esta dupla já está inscrita nesta categoria');
        } else if (error.message?.includes('row-level security policy')) {
          Alert.alert('Perfil Incompleto', 'Complete seu perfil para se inscrever em campeonatos');
        } else {
          throw error;
        }
        return;
      }

      if (status === 'pendente_aprovacao') {
        Alert.alert(
          'Convite enviado!',
          'Os competidores foram notificados e precisam aceitar a inscrição.'
        );
      } else {
        Alert.alert('Sucesso!', 'Inscrição realizada com sucesso');
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao realizar inscrição:', error);
      Alert.alert('Erro', 'Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Inscrever-se no Campeonato</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Selecione dois competidores e uma categoria para realizar a inscrição
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Competidor 1 *</Text>
                {competidor1 ? (
                  <View style={styles.selectedUser}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(competidor1.nome)}</Text>
                    </View>
                    <Text style={styles.selectedUserName}>{competidor1.nome}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCompetidor1(null);
                        setSearchQuery1('');
                      }}
                    >
                      <X color="#6B7280" size={20} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={styles.searchContainer}>
                      <Search color="#9CA3AF" size={20} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar competidor 1..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery1}
                        onChangeText={setSearchQuery1}
                      />
                    </View>
                    {searching1 && (
                      <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />
                    )}
                    {searchResults1.length > 0 && (
                      <View style={styles.resultsList}>
                        {searchResults1.map((user) => (
                          <TouchableOpacity
                            key={user.user_id}
                            style={styles.resultItem}
                            onPress={() => {
                              setCompetidor1(user);
                              setSearchQuery1('');
                              setSearchResults1([]);
                            }}
                          >
                            <View style={styles.avatar}>
                              <Text style={styles.avatarText}>{getInitials(user.nome)}</Text>
                            </View>
                            <Text style={styles.resultName}>{user.nome}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Competidor 2 *</Text>
                {competidor2 ? (
                  <View style={styles.selectedUser}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(competidor2.nome)}</Text>
                    </View>
                    <Text style={styles.selectedUserName}>{competidor2.nome}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCompetidor2(null);
                        setSearchQuery2('');
                      }}
                    >
                      <X color="#6B7280" size={20} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={styles.searchContainer}>
                      <Search color="#9CA3AF" size={20} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar competidor 2..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery2}
                        onChangeText={setSearchQuery2}
                      />
                    </View>
                    {searching2 && (
                      <ActivityIndicator size="small" color="#1E3A8A" style={styles.loader} />
                    )}
                    {searchResults2.length > 0 && (
                      <View style={styles.resultsList}>
                        {searchResults2.map((user) => (
                          <TouchableOpacity
                            key={user.user_id}
                            style={styles.resultItem}
                            onPress={() => {
                              setCompetidor2(user);
                              setSearchQuery2('');
                              setSearchResults2([]);
                            }}
                          >
                            <View style={styles.avatar}>
                              <Text style={styles.avatarText}>{getInitials(user.nome)}</Text>
                            </View>
                            <Text style={styles.resultName}>{user.nome}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoria *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoriesContainer}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category.id && styles.categoryOptionSelected,
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          selectedCategory === category.id && styles.categoryOptionTextSelected,
                        ]}
                      >
                        {category.nome_categoria}
                      </Text>
                      <Text
                        style={[
                          styles.categoryOptionSubtext,
                          selectedCategory === category.id && styles.categoryOptionSubtextSelected,
                        ]}
                      >
                        {category.nivel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Os competidores devem estar cadastrados na plataforma para conseguir fazer a
                  inscrição.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !competidor1 || !competidor2 || !selectedCategory}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Inscrever-se</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  loader: {
    marginTop: 8,
  },
  resultsList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  selectedUserName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoriesContainer: {
    marginTop: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  categoryOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryOptionTextSelected: {
    color: '#1E3A8A',
  },
  categoryOptionSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryOptionSubtextSelected: {
    color: '#1E3A8A',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});



