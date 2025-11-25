import { StyleSheet, Text, View } from 'react-native';
import { CalendarRange, Flag, Users } from 'lucide-react-native';
import { FeedActivity } from '../hooks/useCommunityFeed';

interface FeedActivityCardProps {
  activity: FeedActivity;
}

export function FeedActivityCard({ activity }: FeedActivityCardProps): JSX.Element | null {
  if (activity.type === 'class') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{activity.userName} confirmou presença</Text>
        <View style={styles.row}>
          <CalendarRange color="#6B7280" size={16} />
          <Text style={styles.meta}>
            {activity.classTitle} • {activity.classDate}
          </Text>
        </View>
        <View style={styles.row}>
          <Users color="#6B7280" size={16} />
          <Text style={styles.meta}>{activity.arenaName}</Text>
        </View>
      </View>
    );
  }

  if (activity.type === 'tournament') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{activity.userName} entrou em um campeonato</Text>
        <View style={styles.row}>
          <Flag color="#6B7280" size={16} />
          <Text style={styles.meta}>{activity.tournamentName}</Text>
        </View>
        <Text style={styles.meta}>
          Categoria {activity.tournamentCategory} • Dupla com {activity.partnerName}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    fontSize: 14,
    color: '#4B5563',
  },
});


