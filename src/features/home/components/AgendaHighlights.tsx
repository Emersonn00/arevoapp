import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CalendarRange, Clock3 } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/services/supabase/client';

interface AgendaItem {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  arena: {
    nome: string | null;
  } | null;
}

export function AgendaHighlights(): JSX.Element {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('aulas')
        .select('id, titulo, data, horario, arena:arena_id (nome)')
        .eq('ativo', true)
        .gte('data', today)
        .order('data', { ascending: true })
        .limit(5);

      if (!error && data) {
        setItems(data as AgendaItem[]);
      }
      setLoading(false);
    };

    loadItems();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Agenda de Aulas</Text>
          <Text style={styles.sectionSubtitle}>Confira os próximos horários disponíveis</Text>
        </View>
        <CalendarRange color="#2563EB" size={28} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Text style={styles.emptyState}>Nenhuma aula agendada encontrada.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.agendaCard}>
              <View>
                <Text style={styles.agendaTitle}>{item.titulo}</Text>
                <Text style={styles.agendaArena}>{item.arena?.nome ?? 'Arena parceira'}</Text>
              </View>
              <View style={styles.agendaMetaRow}>
                <View style={styles.metaChip}>
                  <CalendarRange color="#1D4ED8" size={16} />
                  <Text style={styles.metaText}>{formatDate(item.data)}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Clock3 color="#1D4ED8" size={16} />
                  <Text style={styles.metaText}>{item.horario}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const formatDate = (isoDate: string): string => {
  try {
    return format(parseISO(isoDate), "dd 'de' MMMM", { locale: ptBR });
  } catch {
    return isoDate;
  }
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  list: {
    marginTop: 8,
    gap: 12,
  },
  agendaCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  agendaArena: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  agendaMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  emptyState: {
    marginTop: 24,
    textAlign: 'center',
    color: '#6B7280',
  },
});


