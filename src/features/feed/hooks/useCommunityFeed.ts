import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';

export type ActivityType = 'post' | 'class' | 'tournament';

export interface FeedActivity {
  id: string;
  type: ActivityType;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  content?: string;
  imageUrl?: string | null;
  classTitle?: string;
  classDate?: string;
  arenaName?: string;
  tournamentName?: string;
  tournamentCategory?: string;
  partnerName?: string;
}

const fetchCommunityFeed = async (userId?: string): Promise<FeedActivity[]> => {
  if (!userId) return [];

  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = following?.map((row) => row.following_id) ?? [];
  const userIds = Array.from(new Set([...followingIds, userId]));

  if (userIds.length === 0) return [];

  const [{ data: posts }, { data: classEnrollments }, { data: tournamentEnrollments }] =
    await Promise.all([
      supabase
        .from('posts')
        .select('id, content, image_url, created_at, user_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('inscricoes_aulas')
        .select(
          'id, user_id, data_aula, data_inscricao, aulas ( titulo, arenas ( nome ) )',
        )
        .in('user_id', userIds)
        .order('data_inscricao', { ascending: false })
        .limit(30),
      supabase
        .from('inscricoes_campeonatos')
        .select(
          'id, competidor1_id, competidor2_id, created_at, campeonatos ( nome ), categorias_campeonatos ( nome_categoria )',
        )
        .or(`competidor1_id.in.(${userIds.join(',')}),competidor2_id.in.(${userIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

  const profileIds = Array.from(
    new Set([
      ...(posts?.map((p) => p.user_id) ?? []),
      ...(classEnrollments?.map((c) => c.user_id) ?? []),
      ...(tournamentEnrollments?.flatMap((t) => [t.competidor1_id, t.competidor2_id]) ?? []),
    ]),
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, nome, avatar_url')
    .in('user_id', profileIds.length > 0 ? profileIds : ['00000000-0000-0000-0000-000000000000']);

  const profileMap = new Map(
    profiles?.map((profile) => [profile.user_id, profile]) ?? [],
  );

  const activities: FeedActivity[] = [];

  posts?.forEach((post) => {
    const author = profileMap.get(post.user_id);
    activities.push({
      id: post.id,
      type: 'post',
      createdAt: post.created_at,
      userId: post.user_id,
      userName: author?.nome ?? 'Atleta',
      userAvatar: author?.avatar_url,
      content: post.content,
      imageUrl: post.image_url,
    });
  });

  classEnrollments?.forEach((enrollment) => {
    const athlete = profileMap.get(enrollment.user_id);
    activities.push({
      id: enrollment.id,
      type: 'class',
      createdAt: enrollment.data_inscricao,
      userId: enrollment.user_id,
      userName: athlete?.nome ?? 'Atleta',
      userAvatar: athlete?.avatar_url,
      classTitle: enrollment.aulas?.titulo ?? 'Aula',
      classDate: enrollment.data_aula,
      arenaName: enrollment.aulas?.arenas?.nome ?? 'Arena',
    });
  });

  tournamentEnrollments?.forEach((enrollment) => {
    const first = profileMap.get(enrollment.competidor1_id);
    const second = profileMap.get(enrollment.competidor2_id);
    activities.push({
      id: enrollment.id,
      type: 'tournament',
      createdAt: enrollment.created_at,
      userId: enrollment.competidor1_id,
      userName: first?.nome ?? 'Competidor',
      userAvatar: first?.avatar_url,
      tournamentName: enrollment.campeonatos?.nome ?? 'Campeonato',
      tournamentCategory: enrollment.categorias_campeonatos?.nome_categoria ?? 'Categoria',
      partnerName: second?.nome ?? 'Parceiro',
    });
  });

  return activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const useCommunityFeed = (userId?: string) =>
  useQuery({
    queryKey: ['community-feed', userId],
    queryFn: () => fetchCommunityFeed(userId),
    enabled: Boolean(userId),
  });


