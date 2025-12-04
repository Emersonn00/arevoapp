import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';

export interface UserProfile {
  user_id: string;
  nome: string | null;
  telefone: string | null;
  plano: string | null;
  avatar_url?: string | null;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, nome, telefone, plano, avatar_url')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data ?? null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const enabled = !!userId;
  return useQuery({
    queryKey: ['profiles', userId],
    queryFn: () => fetchProfile(userId),
    enabled,
  });
}
