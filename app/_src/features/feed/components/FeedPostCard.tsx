import { Image, StyleSheet, Text, View } from 'react-native';
import { FeedActivity } from '../hooks/useCommunityFeed';

interface FeedPostCardProps {
  activity: FeedActivity;
}

export function FeedPostCard({ activity }: FeedPostCardProps): JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {activity.userAvatar ? (
            <Image source={{ uri: activity.userAvatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarFallback}>{activity.userName[0] ?? 'A'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{activity.userName}</Text>
          <Text style={styles.timestamp}>{new Date(activity.createdAt).toLocaleString('pt-BR')}</Text>
        </View>
      </View>
      {activity.content ? <Text style={styles.content}>{activity.content}</Text> : null}
      {activity.imageUrl ? <Image source={{ uri: activity.imageUrl }} style={styles.image} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  author: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
});


