import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';

export interface AulaItem {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  duracao: number;
  nivel: string | null;
  max_alunos: number | null;
  arena_id: string;
  arenas?: { nome: string; endereco_cidade: string | null } | null;
}

async function fetchMyAulas(userId: string): Promise<AulaItem[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('aulas')
    .select('id, titulo, data, horario, duracao, nivel, max_alunos, arena_id, arenas (nome, endereco_cidade)')
    .eq('professor_id', userId)
    .eq('ativo', true)
    .gte('data', today)
    .order('data', { ascending: true })
    .order('horario', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchArenaAulas(arenaId: string): Promise<AulaItem[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('aulas')
    .select('id, titulo, data, horario, duracao, nivel, max_alunos, arena_id')
    .eq('arena_id', arenaId)
    .eq('ativo', true)
    .gte('data', today)
    .order('data', { ascending: true })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export function useMyAulas() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const enabled = !!userId;
  return useQuery({
    queryKey: ['aulas', 'my', userId],
    queryFn: () => fetchMyAulas(userId),
    enabled,
  });
}

export function useArenaAulas(arenaId: string) {
  return useQuery({
    queryKey: ['aulas', 'arena', arenaId],
    queryFn: () => fetchArenaAulas(arenaId),
    enabled: !!arenaId,
  });
}

