import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase/client';
import { Tables } from '@/services/supabase/types';

type Profile = Tables<'profiles'>;

export default function PerfilTabScreen() {
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      // Se não há usuário, não precisa carregar perfil
      setLoadingProfile(false);
    }
  }, [user]);

  async function loadProfile() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setNome(data.nome || '');
        setTelefone(data.telefone || '');
        setNomeCompleto(data.nome_completo || '');
        setCidade(data.cidade || '');
        setEstado(data.estado || '');
        setBio(data.bio || '');
      } else {
        // Criar perfil se não existir
        const { error: insertError } = await supabase.from('profiles').insert({
          user_id: user.id,
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || '',
          consents_version: '1.0',
          privacy_accepted: false,
          terms_accepted: false,
          image_consent_accepted: false,
          plano: 'gratuito',
        });

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
        } else {
          loadProfile();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil');
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      let errorMessage = 'Email ou senha inválidos';
      
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro ao fazer login', errorMessage);
    }
  }

  async function handleSignUp() {
    if (!email || !password || !nome) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, nome, telefone);
    setIsLoading(false);

    if (error) {
      Alert.alert(
        'Erro ao criar conta',
        error.message || 'Não foi possível criar a conta. Verifique se o email já está cadastrado.',
        [{ text: 'OK' }]
      );
    } else {
      // Após cadastro bem-sucedido, tentar fazer login automaticamente
      Alert.alert(
        'Conta criada!',
        'Sua conta foi criada com sucesso. Fazendo login...',
        [{ text: 'OK' }]
      );
      
      // Tentar fazer login automaticamente
      setIsLoading(true);
      const { error: loginError } = await signIn(email, password);
      setIsLoading(false);

      if (loginError) {
        Alert.alert(
          'Atenção',
          'Conta criada, mas é necessário confirmar o email antes de fazer login. Verifique sua caixa de entrada.',
          [{ text: 'OK' }]
        );
      }
    }
  }

  async function handleSaveProfile() {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: nome || null,
          nome_completo: nomeCompleto || null,
          telefone: telefone || null,
          cidade: cidade || null,
          estado: estado || null,
          bio: bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
      loadProfile();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            setIsEditing(false);
            setProfile(null);
          },
        },
      ]
    );
  }

  // Se ainda estiver carregando autenticação, mostrar loading
  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  // Se não estiver logado, mostrar tela de login/cadastro imediatamente
  if (!user) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Arevo</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Nome"
                placeholderTextColor="#999"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Telefone (opcional)"
                placeholderTextColor="#999"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={isLogin ? handleLogin : handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? 'Entrar' : 'Cadastrar'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.linkText}>
                {isLogin
                  ? 'Não tem uma conta? Cadastre-se'
                  : 'Já tem uma conta? Entre'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Se estiver carregando perfil, mostrar loading
  if (loadingProfile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  // Se estiver logado, mostrar perfil
  const userName = profile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || '';
  const initials = userName.charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {!isEditing && (
              <>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
              </>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                placeholder="Nome"
                placeholderTextColor="#999"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Nome Completo"
                placeholderTextColor="#999"
                value={nomeCompleto}
                onChangeText={setNomeCompleto}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Telefone"
                placeholderTextColor="#999"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Cidade"
                placeholderTextColor="#999"
                value={cidade}
                onChangeText={setCidade}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Estado"
                placeholderTextColor="#999"
                value={estado}
                onChangeText={setEstado}
                autoCapitalize="words"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Bio"
                placeholderTextColor="#999"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.menu}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nome Completo</Text>
                <Text style={styles.infoValue}>
                  {profile?.nome_completo || 'Não informado'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>
                  {profile?.telefone || 'Não informado'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Cidade/Estado</Text>
                <Text style={styles.infoValue}>
                  {profile?.cidade && profile?.estado
                    ? `${profile.cidade}, ${profile.estado}`
                    : 'Não informado'}
                </Text>
              </View>

              {profile?.bio && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.infoValue}>{profile.bio}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={[styles.menuItemText, styles.logoutText]}>Sair</Text>
              </TouchableOpacity>
            </View>
          )}
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
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  editButton: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
    paddingHorizontal: 32,
  },
  editForm: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#333',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#1E3A8A',
    fontSize: 14,
  },
  menu: {
    gap: 12,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutText: {
    color: '#E53935',
  },
  infoItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
});



