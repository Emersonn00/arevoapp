import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Json } from '@/services/supabase/types';

export interface ArenaCardProps {
  id: string;
  nome: string;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  descricao: string | null;
  fotos: Json | null;
  onPress?: (id: string) => void;
  hasAvailability?: boolean;
  availabilityCount?: number;
}

export function ArenaCard({
  id,
  nome,
  endereco_bairro,
  endereco_cidade,
  descricao,
  fotos,
  onPress,
  hasAvailability,
  availabilityCount,
}: ArenaCardProps) {
  const imageSource = extractPrimaryPhoto(fotos);
  return (
    <Pressable style={styles.card} onPress={() => onPress?.(id)}>
      {imageSource ? (
        <View>
          <Image source={{ uri: imageSource }} style={styles.image} />
          {hasAvailability && (
            <View style={styles.availabilityDot} />
          )}
        </View>
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>Sem fotos</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{nome}</Text>
        <View style={styles.locationRow}>
          <MapPin color="#6B7280" size={16} />
          <Text style={styles.location}>
            {[endereco_bairro, endereco_cidade].filter(Boolean).join(', ')}
          </Text>
        </View>
        {availabilityCount ? (
          <Text style={styles.availabilityText}>{availabilityCount} aulas futuras</Text>
        ) : null}
        {descricao ? <Text style={styles.description}>{truncate(descricao, 120)}</Text> : null}
      </View>
    </Pressable>
  );
}

const extractPrimaryPhoto = (fotos: Json | null): string | null => {
  if (Array.isArray(fotos)) {
    for (const foto of fotos) {
      if (typeof foto === 'string') return foto;
      if (typeof foto === 'object' && foto !== null && 'url' in foto) {
        return (foto as { url: string }).url;
      }
    }
  }
  return null;
};

const truncate = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: 180,
  },
  availabilityDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
  availabilityText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
  },
});


