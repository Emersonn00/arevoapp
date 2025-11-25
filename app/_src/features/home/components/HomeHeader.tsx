import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Calendar, Trophy, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function HomeHeader(): JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <Trophy color="#2563EB" size={32} />
        <Text style={styles.logoText}>Arevo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  outlineButtonText: {
    color: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
});


