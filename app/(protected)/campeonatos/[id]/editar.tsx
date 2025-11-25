import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/services/supabase/types';

type Campeonato = Tables<'campeonatos'>;

interface Categoria {
  id?: string;
  nome_categoria: string;
  categoria: string;
  nivel: string;
  limite_duplas: number;
}

export default function EditTournamentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tournament, setTournament] = useState<Campeonato | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState<Categoria>({
    nome_categoria: '',
    categoria: 'Masculino',
    nivel: 'Intermediário',
    limite_duplas: 16,
  });

  useEffect(() => {
    if (user && id) {
      loadTournament();
      loadCategorias();
    }
  }, [user, id]);

  const loadTournament = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('campeonatos')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
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

  const handleSave = async () => {
    if (!tournament || !id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('campeonatos')
        .update({
          nome: tournament.nome,
          organizador: tournament.organizador,
          telefone_contato: tournament.telefone_contato,
          cidade: tournament.cidade,
          estado: tournament.estado,
          local_arena: tournament.local_arena,
          data_inicio: tournament.data_inicio,
          data_fim: tournament.data_fim,
          data_inicio_inscricoes: tournament.data_inicio_inscricoes,
          data_fim_inscricoes: tournament.data_fim_inscricoes,
          data_inicio_pagamento: tournament.data_inicio_pagamento,
          data_fim_pagamento: tournament.data_fim_pagamento,
          taxa_inscricao: tournament.taxa_inscricao,
          max_equipes: tournament.max_equipes,
          regras: tournament.regras,
          tipo_campeonato: tournament.tipo_campeonato,
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Campeonato atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', error.message || 'Erro ao salvar campeonato');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!id || !newCategory.nome_categoria) {
      Alert.alert('Erro', 'Preencha o nome da categoria');
      return;
    }

    try {
      const { error } = await supabase.from('categorias_campeonatos').insert({
        campeonato_id: id,
        nome_categoria: newCategory.nome_categoria,
        categoria: newCategory.categoria,
        nivel: newCategory.nivel,
        limite_duplas: newCategory.limite_duplas,
      });

      if (error) throw error;

      setNewCategory({
        nome_categoria: '',
        categoria: 'Masculino',
        nivel: 'Intermediário',
        limite_duplas: 16,
      });
      setShowCategoryModal(false);
      loadCategorias();
      Alert.alert('Sucesso', 'Categoria adicionada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao adicionar categoria:', error);
      Alert.alert('Erro', error.message || 'Erro ao adicionar categoria');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta categoria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('categorias_campeonatos')
                .delete()
                .eq('id', categoryId);

              if (error) throw error;
              loadCategorias();
              Alert.alert('Sucesso', 'Categoria excluída com sucesso!');
            } catch (error: any) {
              console.error('Erro ao excluir categoria:', error);
              Alert.alert('Erro', error.message || 'Erro ao excluir categoria');
            }
          },
        },
      ]
    );
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

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#111827" size={20} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Editar Campeonato</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Campeonato *</Text>
            <TextInput
              style={styles.input}
              value={tournament.nome || ''}
              onChangeText={(text) => setTournament({ ...tournament, nome: text })}
              placeholder="Nome do campeonato"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organizador *</Text>
            <TextInput
              style={styles.input}
              value={tournament.organizador || ''}
              onChangeText={(text) => setTournament({ ...tournament, organizador: text })}
              placeholder="Nome do organizador"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone de Contato *</Text>
            <TextInput
              style={styles.input}
              value={tournament.telefone_contato || ''}
              onChangeText={(text) => setTournament({ ...tournament, telefone_contato: text })}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Cidade *</Text>
              <TextInput
                style={styles.input}
                value={tournament.cidade || ''}
                onChangeText={(text) => setTournament({ ...tournament, cidade: text })}
                placeholder="Cidade"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Estado *</Text>
              <TextInput
                style={styles.input}
                value={tournament.estado || ''}
                onChangeText={(text) => setTournament({ ...tournament, estado: text })}
                placeholder="Estado"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Local (Arena) *</Text>
            <TextInput
              style={styles.input}
              value={tournament.local_arena || ''}
              onChangeText={(text) => setTournament({ ...tournament, local_arena: text })}
              placeholder="Nome da arena"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Data Início *</Text>
              <TextInput
                style={styles.input}
                value={tournament.data_inicio || ''}
                onChangeText={(text) => setTournament({ ...tournament, data_inicio: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Data Fim *</Text>
              <TextInput
                style={styles.input}
                value={tournament.data_fim || ''}
                onChangeText={(text) => setTournament({ ...tournament, data_fim: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Início Inscrições *</Text>
              <TextInput
                style={styles.input}
                value={tournament.data_inicio_inscricoes || ''}
                onChangeText={(text) =>
                  setTournament({ ...tournament, data_inicio_inscricoes: text })
                }
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Fim Inscrições *</Text>
              <TextInput
                style={styles.input}
                value={tournament.data_fim_inscricoes || ''}
                onChangeText={(text) =>
                  setTournament({ ...tournament, data_fim_inscricoes: text })
                }
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Início Pagamento *</Text>
              <TextInput
                style={styles.input}
                value={tournament.data_inicio_pagamento || ''}
                onChangeText={(text) =>
                  setTournament({ ...tournament, data_inicio_pagamento: text })
                }
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Fim Pagamento *</Text>
              <TextInput
                style={styles.input}
                value={tournament.data_fim_pagamento || ''}
                onChangeText={(text) =>
                  setTournament({ ...tournament, data_fim_pagamento: text })
                }
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Taxa de Inscrição</Text>
              <TextInput
                style={styles.input}
                value={tournament.taxa_inscricao?.toString() || ''}
                onChangeText={(text) =>
                  setTournament({ ...tournament, taxa_inscricao: text ? parseFloat(text) : null })
                }
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Máximo de Equipes</Text>
              <TextInput
                style={styles.input}
                value={tournament.max_equipes?.toString() || ''}
                onChangeText={(text) =>
                  setTournament({ ...tournament, max_equipes: text ? parseInt(text, 10) : null })
                }
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Regras</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={tournament.regras || ''}
              onChangeText={(text) => setTournament({ ...tournament, regras: text })}
              placeholder="Regras do campeonato..."
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Plus color="#FFFFFF" size={20} />
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {categorias.map((categoria) => (
              <View key={categoria.id} style={styles.categoryCard}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{categoria.nome_categoria}</Text>
                  <Text style={styles.categoryDetails}>
                    {categoria.categoria} - {categoria.nivel}
                  </Text>
                  <Text style={styles.categoryLimit}>
                    Limite: {categoria.limite_duplas} duplas
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => categoria.id && handleDeleteCategory(categoria.id)}
                >
                  <Trash2 color="#DC2626" size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {showCategoryModal && (
            <View style={styles.modal}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nova Categoria</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome da categoria"
                  value={newCategory.nome_categoria}
                  onChangeText={(text) => setNewCategory({ ...newCategory, nome_categoria: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Categoria (ex: Masculino, Feminino, Misto)"
                  value={newCategory.categoria}
                  onChangeText={(text) => setNewCategory({ ...newCategory, categoria: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nível (ex: Iniciante, Intermediário, Avançado)"
                  value={newCategory.nivel}
                  onChangeText={(text) => setNewCategory({ ...newCategory, nivel: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Limite de duplas"
                  value={newCategory.limite_duplas.toString()}
                  onChangeText={(text) =>
                    setNewCategory({ ...newCategory, limite_duplas: parseInt(text, 10) || 16 })
                  }
                  keyboardType="number-pad"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowCategoryModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddCategory}>
                    <Text style={styles.saveButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save color="#FFFFFF" size={20} />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  categoryDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  categoryLimit: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
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



