import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Arena {
  id: string;
  nome: string;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
}

export default function CreateClassScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [filteredArenas, setFilteredArenas] = useState<Arena[]>([]);
  const [arenaSearch, setArenaSearch] = useState('');
  const [showArenaList, setShowArenaList] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    data: '',
    horario: '',
    duracao: '60',
    arena_id: '',
    tipo: '',
    nivel: '',
    maxAlunos: '8',
    preco: '',
    descricao: '',
    isRecorrente: false,
    diasSemana: [] as string[],
    aceitaTotalpass: false,
    aceitaWellhub: false,
  });

  useEffect(() => {
    loadArenas();
  }, []);

  useEffect(() => {
    if (arenaSearch) {
      const filtered = arenas.filter(
        (arena) =>
          arena.nome.toLowerCase().includes(arenaSearch.toLowerCase()) ||
          arena.endereco_cidade?.toLowerCase().includes(arenaSearch.toLowerCase()) ||
          arena.endereco_bairro?.toLowerCase().includes(arenaSearch.toLowerCase())
      );
      setFilteredArenas(filtered);
    } else {
      setFilteredArenas(arenas);
    }
  }, [arenaSearch, arenas]);

  const loadArenas = async () => {
    try {
      const { data, error } = await supabase
        .from('arenas')
        .select('id, nome, endereco_bairro, endereco_cidade')
        .eq('ativo', true);

      if (error) throw error;
      setArenas(data || []);
      setFilteredArenas(data || []);
    } catch (error) {
      console.error('Erro ao carregar arenas:', error);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.titulo ||
      !formData.data ||
      !formData.horario ||
      !formData.arena_id ||
      !formData.tipo ||
      !user
    ) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Get professor_id from user profile or use user.id
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase.from('aulas').insert({
        titulo: formData.titulo,
        data: formData.data,
        horario: formData.horario,
        duracao: parseInt(formData.duracao, 10),
        arena_id: formData.arena_id,
        tipo: formData.tipo,
        nivel: formData.nivel || null,
        max_alunos: formData.maxAlunos ? parseInt(formData.maxAlunos, 10) : null,
        preco: formData.preco ? parseFloat(formData.preco) : null,
        descricao: formData.descricao || null,
        is_recorrente: formData.isRecorrente,
        dias_semana: formData.diasSemana.length > 0 ? formData.diasSemana : null,
        aceita_totalpass: formData.aceitaTotalpass,
        aceita_wellhub: formData.aceitaWellhub,
        professor_id: user.id,
        ativo: true,
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Aula criada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar aula:', error);
      Alert.alert('Erro', error.message || 'Erro ao criar aula');
    } finally {
      setLoading(false);
    }
  };

  const toggleDiaSemana = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter((d) => d !== dia)
        : [...prev.diasSemana, dia],
    }));
  };

  const selectedArena = arenas.find((a) => a.id === formData.arena_id);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#111827" size={20} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Criar Aula</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título da Aula *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Aula de Futevôlei - Iniciantes"
              placeholderTextColor="#9CA3AF"
              value={formData.titulo}
              onChangeText={(text) => setFormData({ ...formData, titulo: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={formData.data}
              onChangeText={(text) => setFormData({ ...formData, data: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Horário *</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor="#9CA3AF"
              value={formData.horario}
              onChangeText={(text) => setFormData({ ...formData, horario: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duração (minutos)</Text>
            <TextInput
              style={styles.input}
              placeholder="60"
              placeholderTextColor="#9CA3AF"
              value={formData.duracao}
              onChangeText={(text) => setFormData({ ...formData, duracao: text })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Arena *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowArenaList(!showArenaList)}
            >
              <Text style={selectedArena ? styles.inputText : styles.placeholder}>
                {selectedArena
                  ? `${selectedArena.nome} - ${selectedArena.endereco_cidade}`
                  : 'Selecione uma arena'}
              </Text>
            </TouchableOpacity>
            {showArenaList && (
              <View style={styles.arenaList}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar arena..."
                  placeholderTextColor="#9CA3AF"
                  value={arenaSearch}
                  onChangeText={setArenaSearch}
                />
                <ScrollView style={styles.arenaScroll} nestedScrollEnabled>
                  {filteredArenas.map((arena) => (
                    <TouchableOpacity
                      key={arena.id}
                      style={styles.arenaItem}
                      onPress={() => {
                        setFormData({ ...formData, arena_id: arena.id });
                        setShowArenaList(false);
                        setArenaSearch('');
                      }}
                    >
                      <Text style={styles.arenaName}>{arena.nome}</Text>
                      <Text style={styles.arenaLocation}>
                        {arena.endereco_cidade}
                        {arena.endereco_bairro && ` - ${arena.endereco_bairro}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Aula em grupo, Particular"
              placeholderTextColor="#9CA3AF"
              value={formData.tipo}
              onChangeText={(text) => setFormData({ ...formData, tipo: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nível</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Iniciante, Intermediário, Avançado"
              placeholderTextColor="#9CA3AF"
              value={formData.nivel}
              onChangeText={(text) => setFormData({ ...formData, nivel: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Máximo de Alunos</Text>
            <TextInput
              style={styles.input}
              placeholder="8"
              placeholderTextColor="#9CA3AF"
              value={formData.maxAlunos}
              onChangeText={(text) => setFormData({ ...formData, maxAlunos: text })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={formData.preco}
              onChangeText={(text) => setFormData({ ...formData, preco: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva a aula..."
              placeholderTextColor="#9CA3AF"
              value={formData.descricao}
              onChangeText={(text) => setFormData({ ...formData, descricao: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.checkboxGroup}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, isRecorrente: !formData.isRecorrente })
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  formData.isRecorrente && styles.checkboxBoxChecked,
                ]}
              >
                {formData.isRecorrente && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Aula Recorrente</Text>
            </TouchableOpacity>

            {formData.isRecorrente && (
              <View style={styles.diasSemanaContainer}>
                <Text style={styles.label}>Dias da Semana</Text>
                <View style={styles.diasSemanaGrid}>
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(
                    (dia) => (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.diaButton,
                          formData.diasSemana.includes(dia) && styles.diaButtonSelected,
                        ]}
                        onPress={() => toggleDiaSemana(dia)}
                      >
                        <Text
                          style={[
                            styles.diaButtonText,
                            formData.diasSemana.includes(dia) && styles.diaButtonTextSelected,
                          ]}
                        >
                          {dia.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, aceitaTotalpass: !formData.aceitaTotalpass })
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  formData.aceitaTotalpass && styles.checkboxBoxChecked,
                ]}
              >
                {formData.aceitaTotalpass && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Aceita TotalPass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, aceitaWellhub: !formData.aceitaWellhub })
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  formData.aceitaWellhub && styles.checkboxBoxChecked,
                ]}
              >
                {formData.aceitaWellhub && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Aceita Wellhub</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Criar Aula</Text>
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
  inputText: {
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  arenaList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    marginTop: 8,
  },
  searchInput: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 16,
    color: '#111827',
  },
  arenaScroll: {
    maxHeight: 150,
  },
  arenaItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  arenaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  arenaLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkboxGroup: {
    gap: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#111827',
  },
  diasSemanaContainer: {
    marginTop: 8,
    gap: 8,
  },
  diasSemanaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  diaButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  diaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  diaButtonTextSelected: {
    color: '#1E3A8A',
  },
  submitButton: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});



