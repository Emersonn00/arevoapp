import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Shuffle, Edit, Save, X } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Match {
  id: string;
  round: number;
  match_number: number;
  bracket: string;
  status: string;
  team1_inscription_id: string | null;
  team2_inscription_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  winner_inscription_id: string | null;
  categoria_id: string;
  team1?: {
    competidor1_nome: string;
    competidor2_nome: string;
  };
  team2?: {
    competidor1_nome: string;
    competidor2_nome: string;
  };
}

interface Category {
  id: string;
  nome_categoria: string;
}

export default function TournamentBracketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ team1: '', team2: '' });
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');

  useEffect(() => {
    if (id) {
      loadCategories();
      checkPermissions();
    }
  }, [id, user]);

  useEffect(() => {
    if (selectedCategory && id) {
      loadMatches();
    }
  }, [selectedCategory, id]);

  const checkPermissions = async () => {
    if (!user || !id) {
      setCanManage(false);
      return;
    }

    try {
      // Check if user is owner
      const { data: tournament, error } = await supabase
        .from('campeonatos')
        .select('user_id')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (tournament.user_id === user.id) {
        setCanManage(true);
        return;
      }

      // Check if user is collaborator
      const { data: collaborator } = await supabase
        .from('tournament_collaborators')
        .select('id')
        .eq('tournament_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setCanManage(!!collaborator);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setCanManage(false);
    }
  };

  const loadCategories = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('categorias_campeonatos')
        .select('id, nome_categoria')
        .eq('campeonato_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
      if (data && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!id || !selectedCategory) return;

    try {
      // Use RPC function to get matches with team details
      const { data, error } = await supabase.rpc('get_tournament_matches_with_teams', {
        p_tournament_id: id,
      });

      if (error) throw error;

      // Filter by category and transform data
      const categoryMatches = (data || [])
        .filter((m: any) => m.categoria_id === selectedCategory)
        .map((m: any) => ({
          id: m.id,
          round: m.round,
          match_number: m.match_number,
          bracket: m.bracket,
          status: m.status,
          team1_inscription_id: m.team1_inscription_id,
          team2_inscription_id: m.team2_inscription_id,
          team1_score: m.team1_score,
          team2_score: m.team2_score,
          winner_inscription_id: m.winner_inscription_id,
          categoria_id: m.categoria_id,
          team1: m.team1_competidor1_nome
            ? {
                competidor1_nome: m.team1_competidor1_nome || '',
                competidor2_nome: m.team1_competidor2_nome || '',
              }
            : undefined,
          team2: m.team2_competidor1_nome
            ? {
                competidor1_nome: m.team2_competidor1_nome || '',
                competidor2_nome: m.team2_competidor2_nome || '',
              }
            : undefined,
        }))
        .sort((a, b) => {
          if (a.round !== b.round) return a.round - b.round;
          return a.match_number - b.match_number;
        });

      setMatches(categoryMatches);
    } catch (error) {
      console.error('Erro ao carregar partidas:', error);
      // Fallback to basic query
      try {
        const { data, error } = await supabase
          .from('tournament_matches')
          .select('*')
          .eq('tournament_id', id)
          .eq('categoria_id', selectedCategory)
          .order('round', { ascending: true })
          .order('match_number', { ascending: true });

        if (error) throw error;
        setMatches(data || []);
      } catch (fallbackError) {
        console.error('Erro ao carregar partidas (fallback):', fallbackError);
      }
    }
  };

  const handleDraw = async () => {
    if (!selectedCategory || !id) return;

    Alert.alert(
      'Realizar Sorteio',
      'Deseja realizar o sorteio para esta categoria? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('perform_tournament_draw', {
                p_tournament_id: id,
                p_categoria_id: selectedCategory,
              });

              if (error) throw error;

              Alert.alert('Sucesso', 'Sorteio realizado com sucesso!');
              loadMatches();
            } catch (error: any) {
              console.error('Erro ao realizar sorteio:', error);
              Alert.alert('Erro', error.message || 'Erro ao realizar sorteio');
            }
          },
        },
      ]
    );
  };

  const handleUpdateScore = async (matchId: string) => {
    if (!editScores.team1 || !editScores.team2) {
      Alert.alert('Erro', 'Preencha ambos os placares');
      return;
    }

    const score1 = parseInt(editScores.team1, 10);
    const score2 = parseInt(editScores.team2, 10);

    if (isNaN(score1) || isNaN(score2)) {
      Alert.alert('Erro', 'Placares devem ser números válidos');
      return;
    }

    try {
      const match = matches.find((m) => m.id === matchId);
      if (!match) return;

      const winnerId = score1 > score2 ? match.team1_inscription_id : match.team2_inscription_id;

      const { error } = await supabase
        .from('tournament_matches')
        .update({
          team1_score: score1,
          team2_score: score2,
          winner_inscription_id: winnerId,
          status: 'completed',
        })
        .eq('id', matchId);

      if (error) throw error;

      // Update next match if exists
      await updateNextMatch(match, winnerId);

      setEditingMatch(null);
      setEditScores({ team1: '', team2: '' });
      loadMatches();
      Alert.alert('Sucesso', 'Placar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar placar:', error);
      Alert.alert('Erro', error.message || 'Erro ao atualizar placar');
    }
  };

  const updateNextMatch = async (currentMatch: Match, winnerId: string | null) => {
    if (!winnerId) return;

    try {
      // Find next match for winner
      const { data: nextMatches, error } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', id)
        .eq('categoria_id', selectedCategory)
        .or(`next_match_winner_id.eq.${currentMatch.id},next_match_loser_id.eq.${currentMatch.id}`);

      if (error || !nextMatches || nextMatches.length === 0) return;

      const nextMatch = nextMatches[0];
      const isWinnerBracket = nextMatch.next_match_winner_id === currentMatch.id;

      if (isWinnerBracket) {
        await supabase
          .from('tournament_matches')
          .update({
            team1_inscription_id:
              nextMatch.round % 2 === 1 ? winnerId : nextMatch.team1_inscription_id,
            team2_inscription_id:
              nextMatch.round % 2 === 1 ? nextMatch.team2_inscription_id : winnerId,
          })
          .eq('id', nextMatch.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar próxima partida:', error);
    }
  };

  const getMatchesByRound = (round: number, bracket: string) => {
    return matches.filter((m) => m.round === round && m.bracket === bracket);
  };

  const getMaxRound = () => {
    if (matches.length === 0) return 0;
    return Math.max(...matches.map((m) => m.round));
  };

  const renderTreeView = () => {
    const maxRound = getMaxRound();
    if (maxRound === 0) return null;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.treeContainer}>
        <View style={styles.treeContent}>
          {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => {
            const roundMatches = getMatchesByRound(round, 'winner');
            return (
              <View key={round} style={styles.roundColumn}>
                <Text style={styles.roundTitle}>
                  {round === maxRound
                    ? 'Final'
                    : round === maxRound - 1
                      ? 'Semi-final'
                      : `Rodada ${round}`}
                </Text>
                <View style={styles.matchesColumn}>
                  {roundMatches.map((match) => (
                    <View key={match.id} style={styles.treeMatchCard}>
                      <View style={styles.treeMatchHeader}>
                        <Text style={styles.treeMatchNumber}>Partida {match.match_number}</Text>
                        {canManage && match.status !== 'completed' && (
                          <TouchableOpacity
                            style={styles.editScoreButton}
                            onPress={() => {
                              setEditingMatch(match.id);
                              setEditScores({
                                team1: match.team1_score?.toString() || '',
                                team2: match.team2_score?.toString() || '',
                              });
                            }}
                          >
                            <Edit color="#1E3A8A" size={16} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={styles.treeTeam}>
                        <Text
                          style={[
                            styles.treeTeamName,
                            match.winner_inscription_id === match.team1_inscription_id &&
                              styles.treeTeamWinner,
                          ]}
                        >
                          {match.team1
                            ? `${match.team1.competidor1_nome} / ${match.team1.competidor2_nome}`
                            : match.team1_inscription_id
                              ? 'Equipe 1'
                              : 'Aguardando'}
                        </Text>
                        {match.team1_score !== null && (
                          <Text
                            style={[
                              styles.treeScore,
                              match.winner_inscription_id === match.team1_inscription_id &&
                                styles.treeScoreWinner,
                            ]}
                          >
                            {match.team1_score}
                          </Text>
                        )}
                      </View>
                      <View style={styles.treeTeam}>
                        <Text
                          style={[
                            styles.treeTeamName,
                            match.winner_inscription_id === match.team2_inscription_id &&
                              styles.treeTeamWinner,
                          ]}
                        >
                          {match.team2
                            ? `${match.team2.competidor1_nome} / ${match.team2.competidor2_nome}`
                            : match.team2_inscription_id
                              ? 'Equipe 2'
                              : 'Aguardando'}
                        </Text>
                        {match.team2_score !== null && (
                          <Text
                            style={[
                              styles.treeScore,
                              match.winner_inscription_id === match.team2_inscription_id &&
                                styles.treeScoreWinner,
                            ]}
                          >
                            {match.team2_score}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.treeMatchStatus}>
                        {match.status === 'completed' ? 'Finalizada' : 'Pendente'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#111827" size={20} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Trophy color="#9CA3AF" size={48} />
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
        </View>
      </View>
    );
  }

  const maxRound = getMaxRound();
  const hasMatches = matches.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#111827" size={20} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chaveamento</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.categoryTabTextActive,
                ]}
              >
                {category.nome_categoria}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {canManage && !hasMatches && (
        <View style={styles.drawSection}>
          <TouchableOpacity style={styles.drawButton} onPress={handleDraw}>
            <Shuffle color="#FFFFFF" size={20} />
            <Text style={styles.drawButtonText}>Realizar Sorteio</Text>
          </TouchableOpacity>
          <Text style={styles.drawHint}>
            Realize o sorteio para gerar o chaveamento desta categoria
          </Text>
        </View>
      )}

      {!hasMatches && (
        <View style={styles.emptyContainer}>
          <Trophy color="#9CA3AF" size={48} />
          <Text style={styles.emptyText}>
            {canManage
              ? 'Nenhum chaveamento gerado ainda'
              : 'Chaveamento ainda não foi gerado'}
          </Text>
        </View>
      )}

      {hasMatches && (
        <>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'tree' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('tree')}
            >
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === 'tree' && styles.viewModeTextActive,
                ]}
              >
                Árvore
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === 'list' && styles.viewModeTextActive,
                ]}
              >
                Lista
              </Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'tree' ? (
            renderTreeView()
          ) : (
            <ScrollView style={styles.bracketContainer} showsVerticalScrollIndicator={false}>
              {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => (
                <View key={round} style={styles.roundContainer}>
                  <Text style={styles.roundTitle}>
                    {round === maxRound
                      ? 'Final'
                      : round === maxRound - 1
                        ? 'Semi-final'
                        : `Rodada ${round}`}
                  </Text>
                  <View style={styles.matchesContainer}>
                    {getMatchesByRound(round, 'winner').map((match) => (
                      <View key={match.id} style={styles.matchCard}>
                        <View style={styles.matchHeader}>
                          <Text style={styles.matchNumber}>Partida {match.match_number}</Text>
                          {canManage && match.status !== 'completed' && (
                            <TouchableOpacity
                              style={styles.editScoreButton}
                              onPress={() => {
                                setEditingMatch(match.id);
                                setEditScores({
                                  team1: match.team1_score?.toString() || '',
                                  team2: match.team2_score?.toString() || '',
                                });
                              }}
                            >
                              <Edit color="#1E3A8A" size={18} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={styles.teamContainer}>
                          <View
                            style={[
                              styles.team,
                              match.winner_inscription_id === match.team1_inscription_id &&
                                styles.teamWinner,
                            ]}
                          >
                            <Text style={styles.teamText}>
                              {match.team1
                                ? `${match.team1.competidor1_nome} / ${match.team1.competidor2_nome}`
                                : match.team1_inscription_id
                                  ? 'Equipe 1'
                                  : 'Aguardando'}
                            </Text>
                            {match.team1_score !== null && (
                              <Text style={styles.score}>{match.team1_score}</Text>
                            )}
                          </View>
                          <View
                            style={[
                              styles.team,
                              match.winner_inscription_id === match.team2_inscription_id &&
                                styles.teamWinner,
                            ]}
                          >
                            <Text style={styles.teamText}>
                              {match.team2
                                ? `${match.team2.competidor1_nome} / ${match.team2.competidor2_nome}`
                                : match.team2_inscription_id
                                  ? 'Equipe 2'
                                  : 'Aguardando'}
                            </Text>
                            {match.team2_score !== null && (
                              <Text style={styles.score}>{match.team2_score}</Text>
                            )}
                          </View>
                        </View>
                        <Text style={styles.matchStatus}>
                          {match.status === 'completed' ? 'Finalizada' : 'Pendente'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {editingMatch && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Placar</Text>
                <TouchableOpacity onPress={() => setEditingMatch(null)}>
                  <X color="#6B7280" size={24} />
                </TouchableOpacity>
              </View>
              <View style={styles.scoreInputs}>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreLabel}>Equipe 1</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={editScores.team1}
                    onChangeText={(text) => setEditScores({ ...editScores, team1: text })}
                    placeholder="0"
                    keyboardType="number-pad"
                  />
                </View>
                <Text style={styles.scoreSeparator}>x</Text>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreLabel}>Equipe 2</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={editScores.team2}
                    onChangeText={(text) => setEditScores({ ...editScores, team2: text })}
                    placeholder="0"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingMatch(null);
                    setEditScores({ team1: '', team2: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => editingMatch && handleUpdateScore(editingMatch)}
                >
                  <Save color="#FFFFFF" size={18} />
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    maxHeight: 60,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTabTextActive: {
    color: '#1E3A8A',
  },
  drawSection: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  drawButton: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minWidth: 200,
  },
  drawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  drawHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  bracketContainer: {
    flex: 1,
    padding: 16,
  },
  roundContainer: {
    marginBottom: 32,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  matchesContainer: {
    gap: 16,
  },
  matchCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  teamContainer: {
    gap: 8,
  },
  team: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  teamWinner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  teamText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  matchStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'right',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editScoreButton: {
    padding: 6,
  },
  viewModeToggle: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewModeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewModeTextActive: {
    color: '#1E3A8A',
  },
  treeContainer: {
    flex: 1,
  },
  treeContent: {
    flexDirection: 'row',
    padding: 16,
    minWidth: '100%',
  },
  roundColumn: {
    marginRight: 24,
    minWidth: 200,
  },
  matchesColumn: {
    gap: 16,
    marginTop: 12,
  },
  treeMatchCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 180,
  },
  treeMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  treeMatchNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  treeTeam: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  treeTeamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  treeTeamWinner: {
    fontWeight: '700',
    color: '#1E3A8A',
  },
  treeScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 8,
  },
  treeScoreWinner: {
    color: '#1E3A8A',
  },
  treeMatchStatus: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  scoreInputGroup: {
    flex: 1,
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  scoreInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

