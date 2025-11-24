import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFound(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela não encontrada</Text>
      <Text style={styles.subtitle}>
        O caminho informado não existe no aplicativo Arevo. Volte para a tela inicial.
      </Text>
      <Link href="/" style={styles.link}>
        Ir para o início
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  link: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});


