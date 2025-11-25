import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from 'react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FeedComposerProps {
  onPostCreated?: () => void;
}

export function FeedComposer({ onPostCreated }: FeedComposerProps): JSX.Element {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Faça login', 'Entre na sua conta para publicar no feed.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Conteúdo vazio', 'Escreva algo antes de publicar.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('posts').insert({
      content: content.trim(),
      user_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível publicar agora.');
      return;
    }
    setContent('');
    onPostCreated?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compartilhe sua atividade</Text>
      <TextInput
        style={styles.input}
        placeholder="Conte para a comunidade sobre seu treino..."
        placeholderTextColor="#9CA3AF"
        multiline
        value={content}
        onChangeText={setContent}
      />
      <View style={styles.buttonWrapper}>
        <Button title={submitting ? 'Publicando...' : 'Publicar'} onPress={handleSubmit} disabled={submitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    minHeight: 80,
    maxHeight: 160,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  buttonWrapper: {
    alignSelf: 'flex-end',
  },
});


