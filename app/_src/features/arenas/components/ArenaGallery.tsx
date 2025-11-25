import { FlatList, Image, StyleSheet, View } from 'react-native';
import { Json } from '@/services/supabase/types';

interface ArenaGalleryProps {
  fotos: Json | null;
}

export function ArenaGallery({ fotos }: ArenaGalleryProps): JSX.Element {
  const photos = extractPhotos(fotos);

  if (photos.length === 0) {
    return <View style={[styles.image, styles.placeholder]} />;
  }

  return (
    <FlatList
      data={photos}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => `${item}-${index}`}
      renderItem={({ item }) => <Image source={{ uri: item }} style={styles.image} />}
      contentContainerStyle={styles.listContent}
    />
  );
}

const extractPhotos = (fotos: Json | null): string[] => {
  if (!Array.isArray(fotos)) return [];
  return fotos
    .map((foto) => {
      if (typeof foto === 'string') return foto;
      if (typeof foto === 'object' && foto !== null && 'url' in foto) {
        return (foto as { url: string }).url;
      }
      return null;
    })
    .filter((url): url is string => Boolean(url));
};

const styles = StyleSheet.create({
  listContent: {
    gap: 12,
    paddingVertical: 12,
  },
  image: {
    width: 240,
    height: 180,
    borderRadius: 16,
  },
  placeholder: {
    backgroundColor: '#E5E7EB',
  },
});


