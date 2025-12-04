import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';

export interface ArenaListItem {
  id: string;
  nome: string;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  descricao: string | null;
  fotos: unknown | null;
}

async function fetchArenas(): Promise<ArenaListItem[]> {
  const { data, error } = await supabase
    .from('arenas')
    .select('id, nome, endereco_bairro, endereco_cidade, descricao, fotos')
    .eq('ativo', true)
    .order('nome', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useArenas() {
  const query = useQuery({
    queryKey: ['arenas', 'list'],
    queryFn: fetchArenas,
  });
  return query;
}

