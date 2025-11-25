import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase/client';

export default function CriarCampeonatoScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(tabs)/perfil');
    }
  }, [user, authLoading]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [organizador, setOrganizador] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [localArena, setLocalArena] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dataInicioInscricoes, setDataInicioInscricoes] = useState('');
  const [dataFimInscricoes, setDataFimInscricoes] = useState('');
  const [dataInicioPagamento, setDataInicioPagamento] = useState('');
  const [dataFimPagamento, setDataFimPagamento] = useState('');
  const [taxaInscricao, setTaxaInscricao] = useState('');
  const [maxEquipes, setMaxEquipes] = useState('');
  const [tipoCampeonato, setTipoCampeonato] = useState('');
  const [regras, setRegras] = useState('');
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);

  async function handleSubmit() {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para criar um campeonato');
      return;
    }

    // Validações básicas
    if (
      !nome ||
      !organizador ||
      !cidade ||
      !estado ||
      !localArena ||
      !telefoneContato ||
      !dataInicio ||
      !dataFim ||
      !dataInicioInscricoes ||
      !dataFimInscricoes ||
      !dataInicioPagamento ||
      !dataFimPagamento
    ) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      const campeonatoData = {
        nome,
        organizador,
        cidade,
        estado,
        local_arena: localArena,
        telefone_contato: telefoneContato,
        data_inicio: dataInicio,
        data_fim: dataFim,
        data_inicio_inscricoes: dataInicioInscricoes,
        data_fim_inscricoes: dataFimInscricoes,
        data_inicio_pagamento: dataInicioPagamento,
        data_fim_pagamento: dataFimPagamento,
        taxa_inscricao: taxaInscricao ? parseFloat(taxaInscricao) : null,
        max_equipes: maxEquipes ? parseInt(maxEquipes, 10) : null,
        tipo_campeonato: tipoCampeonato || null,
        regras: regras || null,
        inscricoes_abertas: inscricoesAbertas,
        ativo: true,
        user_id: user.id,
      };

      const { error } = await supabase.from('campeonatos').insert(campeonatoData);

      if (error) throw error;

      Alert.alert('Sucesso', 'Campeonato criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/campeonatos');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar campeonato:', error);
      Alert.alert('Erro', error.message || 'Erro ao criar campeonato');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Campeonato</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome do Campeonato *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Campeonato Regional de Futevôlei"
            placeholderTextColor="#999"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Organizador *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do organizador"
            placeholderTextColor="#999"
            value={organizador}
            onChangeText={setOrganizador}
          />

          <Text style={styles.label}>Cidade *</Text>
          <TextInput
            style={styles.input}
            placeholder="Cidade"
            placeholderTextColor="#999"
            value={cidade}
            onChangeText={setCidade}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Estado *</Text>
          <TextInput
            style={styles.input}
            placeholder="Estado (ex: RJ, SP)"
            placeholderTextColor="#999"
            value={estado}
            onChangeText={setEstado}
            autoCapitalize="characters"
            maxLength={2}
          />

          <Text style={styles.label}>Local/Arena *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do local ou arena"
            placeholderTextColor="#999"
            value={localArena}
            onChangeText={setLocalArena}
          />

          <Text style={styles.label}>Telefone de Contato *</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            placeholderTextColor="#999"
            value={telefoneContato}
            onChangeText={setTelefoneContato}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Data de Início *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={dataInicio}
            onChangeText={setDataInicio}
          />

          <Text style={styles.label}>Data de Fim *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={dataFim}
            onChangeText={setDataFim}
          />

          <Text style={styles.label}>Início das Inscrições *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={dataInicioInscricoes}
            onChangeText={setDataInicioInscricoes}
          />

          <Text style={styles.label}>Fim das Inscrições *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={dataFimInscricoes}
            onChangeText={setDataFimInscricoes}
          />

          <Text style={styles.label}>Início do Pagamento *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={dataInicioPagamento}
            onChangeText={setDataInicioPagamento}
          />

          <Text style={styles.label}>Fim do Pagamento *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={dataFimPagamento}
            onChangeText={setDataFimPagamento}
          />

          <Text style={styles.label}>Taxa de Inscrição (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#999"
            value={taxaInscricao}
            onChangeText={setTaxaInscricao}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Máximo de Equipes</Text>
          <TextInput
            style={styles.input}
            placeholder="Número máximo de equipes"
            placeholderTextColor="#999"
            value={maxEquipes}
            onChangeText={setMaxEquipes}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Tipo de Campeonato</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Duplas, Trios, etc."
            placeholderTextColor="#999"
            value={tipoCampeonato}
            onChangeText={setTipoCampeonato}
          />

          <Text style={styles.label}>Regras</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva as regras do campeonato"
            placeholderTextColor="#999"
            value={regras}
            onChangeText={setRegras}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.switchContainer}
            onPress={() => setInscricoesAbertas(!inscricoesAbertas)}
          >
            <Text style={styles.switchLabel}>Inscrições Abertas</Text>
            <View
              style={[
                styles.switch,
                inscricoesAbertas && styles.switchActive,
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  inscricoesAbertas && styles.switchThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Criar Campeonato</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#1E3A8A',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  button: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

