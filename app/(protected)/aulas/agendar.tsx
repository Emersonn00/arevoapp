import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { addMonths, addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, startOfDay, startOfMonth, startOfWeek, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ArenaItem {
  id: string;
  nome: string;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
}

interface AulaItem {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  duracao: number;
  max_alunos: number | null;
  arenas: { nome: string; endereco_cidade: string | null } | null;
  descricao?: string | null;
  tipo?: string | null;
  nivel?: string | null;
  is_recorrente?: boolean | null;
  dias_semana?: string[] | null;
  preco?: number | null;
  aceita_totalpass?: boolean | null;
  aceita_wellhub?: boolean | null;
  arena_id?: string;
  professor_id?: string;
}

export default function ScheduleClassScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { arenaId } = useLocalSearchParams<{ arenaId?: string }>();

  const [arenas, setArenas] = useState<ArenaItem[]>([]);
  const [selectedArenaId, setSelectedArenaId] = useState<string | null>(typeof arenaId === 'string' ? arenaId : null);
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<AulaItem[]>([]);
  const [loadingArenas, setLoadingArenas] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showPicker, setShowPicker] = useState(false);
  const [capacityByClass, setCapacityByClass] = useState<Record<string, { max_alunos: number; vagas_disponiveis: number; current_inscricoes: number; is_full: boolean }>>({});
  const [paymentSelection, setPaymentSelection] = useState<Record<string, 'totalpass' | 'wellhub' | 'nao'>>({});
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewAula, setReviewAula] = useState<AulaItem | null>(null);
  const [reviewMethod, setReviewMethod] = useState<'totalpass' | 'wellhub' | 'nao' | 'pix' | 'cartao' | 'creditos'>('nao');
  const debugLog = (...args: any[]) => {
    try {
      console.log('[Agendar]', ...args);
    } catch {}
  };

  useEffect(() => {
    loadArenas();
  }, []);

  useEffect(() => {
    setSelectedDate(null);
    setClasses([]);
    setAvailableDates(new Set());
    if (!selectedArenaId) return;
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    loadAvailabilityForMonth(selectedArenaId, start, end);
  }, [selectedArenaId]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const filteredArenas = useMemo(() => {
    if (!search) return arenas;
    const q = search.toLowerCase();
    return arenas.filter((a) =>
      [a.nome, a.endereco_cidade, a.endereco_bairro].filter(Boolean).some((v) => v?.toLowerCase().includes(q)),
    );
  }, [arenas, search]);

  const loadArenas = async () => {
    setLoadingArenas(true);
    try {
      const { data, error } = await supabase
        .from('arenas')
        .select('id, nome, endereco_bairro, endereco_cidade')
        .eq('ativo', true)
        .order('nome', { ascending: true });
      if (error) throw error;
      setArenas(data || []);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar arenas');
    } finally {
      setLoadingArenas(false);
    }
  };

  const loadClassesForDate = async (arena: string, date: string) => {
    setLoadingClasses(true);
    try {
      const targetDate = convertToBrasiliaDate(`${date}T00:00:00`);
      debugLog('loadClassesForDate:start', { arena, date, targetDate });

      const { data: nonRecurring, error: nonErr, status: nrStatus, statusText: nrStatusText } = await supabase
        .from('aulas')
        .select('id, titulo, descricao, data, horario, duracao, tipo, nivel, max_alunos, preco, is_recorrente, dias_semana, arena_id, aceita_totalpass, aceita_wellhub, professor_id')
        .eq('arena_id', arena)
        .eq('ativo', true)
        .eq('is_recorrente', false)
        .eq('data', targetDate);
      debugLog('nonRecurring:response', { status: nrStatus, statusText: nrStatusText, error: nonErr?.message, count: (nonRecurring || []).length });
      if (nonErr) throw nonErr;

      const { data: recurring, error: recErr, status: recStatus, statusText: recStatusText } = await supabase
        .from('aulas')
        .select('id, titulo, descricao, data, horario, duracao, tipo, nivel, max_alunos, preco, is_recorrente, dias_semana, arena_id, aceita_totalpass, aceita_wellhub, professor_id')
        .eq('arena_id', arena)
        .eq('ativo', true)
        .eq('is_recorrente', true);
      debugLog('recurring:response', { status: recStatus, statusText: recStatusText, error: recErr?.message, count: (recurring || []).length });
      if (recErr) throw recErr;

      const dayMapping: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
      const baseDate = parse(targetDate, 'yyyy-MM-dd', new Date());
      const dayOfWeek = baseDate.getDay();
      const dayName = Object.keys(dayMapping).find((k) => dayMapping[k] === dayOfWeek);
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

      const expandedRecurring: AulaItem[] = [];
      (recurring || []).forEach((a: any) => {
        if (Array.isArray(a.dias_semana) && dayName && a.dias_semana.includes(dayName)) {
          const classDateTime = new Date(baseDate);
          const [hh, mm] = String(a.horario || '').split(':');
          classDateTime.setHours(parseInt(hh || '0', 10), parseInt(mm || '0', 10), 0, 0);
          const isToday = baseDate.toDateString() === now.toDateString();
          if (!isToday || classDateTime > fifteenMinutesFromNow) {
            expandedRecurring.push({ ...a, data: targetDate, id: `${a.id}-${targetDate}`, arenas: a.arenas ?? null });
          }
        }
      });

      let rows: AulaItem[] = ([ ...(nonRecurring || []), ...expandedRecurring ]
        .map((r) => ({ ...(r as any), arenas: (r as any).arenas ?? null })) as AulaItem[]);
      rows.sort((a, b) => String(a.horario).localeCompare(String(b.horario)));
      debugLog('merged:rows', { count: rows.length, sample: rows.slice(0, 3) });

      const classIds = rows.map((r) => (r.id.length > 36 && r.id.includes('-') ? r.id.slice(0, -11) : r.id));
      if (classIds.length > 0) {
        debugLog('capacity:request', { class_ids: classIds, target_date: targetDate });
        const { data: capacity, error: capErr, status: capStatus, statusText: capStatusText } = await supabase.rpc('get_capacity_for_classes', { class_ids: classIds, target_date: targetDate });
        debugLog('capacity:response', { status: capStatus, statusText: capStatusText, error: capErr?.message, count: (capacity || []).length });
        if (!capErr && capacity) {
          const map: Record<string, { max_alunos: number; vagas_disponiveis: number; current_inscricoes: number; is_full: boolean }> = {};
          capacity.forEach((c: any) => {
            map[c.aula_id] = { max_alunos: c.max_alunos, vagas_disponiveis: c.vagas_disponiveis, current_inscricoes: c.current_inscricoes, is_full: c.is_full };
          });
          setCapacityByClass(map);
        } else {
          setCapacityByClass({});
        }
      } else {
        setCapacityByClass({});
      }

      setClasses(rows || []);
    } catch (e) {
      debugLog('loadClassesForDate:error', { message: (e as any)?.message });
      Alert.alert('Erro', 'Não foi possível carregar aulas');
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadAvailabilityForMonth = async (arena: string, start: string, end: string) => {
    try {
      const { data, error } = await supabase
        .from('aulas')
        .select('data')
        .eq('arena_id', arena)
        .eq('ativo', true)
        .gte('data', start)
        .lte('data', end);
      if (error) throw error;
      const set = new Set<string>();
      (data || []).forEach((row: { data: string }) => {
        const d = typeof row.data === 'string' && row.data.includes('T') ? row.data.split('T')[0] : row.data;
        set.add(d);
      });
      setAvailableDates(set);
    } catch {
      setAvailableDates(new Set());
    }
  };

  const handleEnroll = async (aula: AulaItem) => {
    if (!user) return;
    try {
      const { data: authUserRes } = await supabase.auth.getUser();
      const authUid = authUserRes?.user?.id || null;
      debugLog('auth:context', { authUid, localUserId: user.id });
      if (!authUid || authUid !== user.id) {
        await supabase.auth.refreshSession();
        const { data: authUserRes2 } = await supabase.auth.getUser();
        const authUid2 = authUserRes2?.user?.id || null;
        debugLog('auth:refresh', { authUid2 });
        if (!authUid2 || authUid2 !== user.id) {
          Alert.alert('Sessão expirada', 'Faça login novamente para agendar');
          return;
        }
      }

      const originalId = /-\d{4}-\d{2}-\d{2}$/.test(aula.id) ? aula.id.slice(0, -11) : aula.id;
      const effectiveDate = aula.data.includes('T') ? aula.data.split('T')[0] : aula.data;
      const targetDate = convertToBrasiliaDate(`${effectiveDate}T00:00:00`);
      debugLog('enroll:start', { originalId, effectiveDate, targetDate, arenaId: selectedArenaId });

      if (!isBookingOpenTwoDaysBefore(targetDate)) {
        Alert.alert('Agendamento indisponível', 'Esta aula só poderá ser agendada 2 dias antes do dia da aula');
        return;
      }

      const arenaId = selectedArenaId || '';
      if (!arenaId) {
        Alert.alert('Erro', 'Arena não selecionada');
        return;
      }

      const cap = capacityByClass[originalId];
      if (cap?.is_full) {
        Alert.alert('Aula lotada', 'Não há vagas disponíveis');
        return;
      }

      debugLog('sameArena:request', { p_user_id: user.id, p_arena_id: arenaId, p_data_aula: targetDate, p_exclude_aula_id: originalId });
      const { data: sameArenaCheck, error: sameArenaErr, status: sameArenaStatus, statusText: sameArenaStatusText } = await supabase.rpc('check_same_arena_enrollment', {
        p_user_id: user.id,
        p_arena_id: arenaId,
        p_data_aula: targetDate,
        p_exclude_aula_id: originalId,
      }).single();
      debugLog('sameArena:response', { status: sameArenaStatus, statusText: sameArenaStatusText, error: sameArenaErr?.message, data: sameArenaCheck });

      if (sameArenaCheck?.has_enrollment) {
        Alert.alert('Limite atingido', 'Você já tem uma aula agendada nesta arena para este dia');
        return;
      }


      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nome, telefone, aplicativo_bem_estar')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;

      let paymentMethod = (profileData?.aplicativo_bem_estar as 'totalpass' | 'wellhub' | 'nao' | undefined) || 'nao';
      const acceptsTP = aula.aceita_totalpass === true;
      const acceptsWH = aula.aceita_wellhub === true;
      const allowedSet = [acceptsTP ? 'totalpass' : null, acceptsWH ? 'wellhub' : null].filter(Boolean) as ('totalpass' | 'wellhub')[];
      const finalize = async (method: 'totalpass' | 'wellhub' | 'nao') => {
        const { data: banInfo } = await supabase.rpc('get_arena_ban_status', { target_arena_id: arenaId });
        const banned = Array.isArray(banInfo) ? !!banInfo[0]?.banned : !!(banInfo as any)?.banned;
        if (banned) {
          const banEndDate = Array.isArray(banInfo) ? banInfo[0]?.ban_end : (banInfo as any)?.ban_end;
          const endStr = banEndDate ? new Date(banEndDate).toLocaleDateString('pt-BR') : '';
          Alert.alert('Agendamento bloqueado', `Você está bloqueado para agendar nesta arena até ${endStr}`);
          return;
        }
        debugLog('insert:request', { aula_id: originalId, user_id: user.id, data_aula: targetDate, aplicativo_bem_estar: method, nome_aluno: profileData?.nome, telefone_aluno: profileData?.telefone ?? '' });
        const { error } = await supabase
          .from('inscricoes_aulas')
          .insert({
            aula_id: originalId,
            user_id: user.id,
            data_aula: targetDate,
            nome_aluno: profileData?.nome || user.email || 'Aluno',
            telefone_aluno: profileData?.telefone ?? '',
            aplicativo_bem_estar: method,
          });
        if (error) {
          const msg = error.message || '';
          debugLog('insert:error', { code: (error as any)?.code, message: msg, details: (error as any)?.details, hint: (error as any)?.hint });
          if (msg.includes('CLASS_FULL')) {
            Alert.alert('Aula lotada', 'Não há vagas disponíveis');
          } else if (msg.includes('ALREADY_SUBSCRIBED')) {
            Alert.alert('Já inscrito', 'Você já está inscrito nesta aula');
          } else if (msg.includes('ARENA_DAY_LIMIT')) {
            Alert.alert('Limite atingido', 'Você já possui um agendamento nesta arena para o dia');
          } else if (msg.includes('WEEKLY_LIMIT_REACHED')) {
            Alert.alert('Limite semanal', 'Limite de agendamentos semanais atingido');
          } else if (msg.includes('row-level security policy')) {
            try {
              const { data: banInfo2 } = await supabase.rpc('get_arena_ban_status', { target_arena_id: arenaId });
              const banned2 = Array.isArray(banInfo2) ? !!banInfo2[0]?.banned : !!(banInfo2 as any)?.banned;
              if (banned2) {
                const banEndDate2 = Array.isArray(banInfo2) ? banInfo2[0]?.ban_end : (banInfo2 as any)?.ban_end;
                const endStr2 = banEndDate2 ? new Date(banEndDate2).toLocaleDateString('pt-BR') : '';
                Alert.alert('Agendamento bloqueado', `Você está bloqueado para agendar nesta arena até ${endStr2}`);
              } else {
                Alert.alert('Erro', 'Permissão negada pela política de segurança. Faça login novamente e tente de novo.');
              }
            } catch {
              Alert.alert('Erro', 'Permissão negada pela política de segurança. Faça login novamente e tente de novo.');
            }
          } else {
            Alert.alert('Erro', 'Não foi possível agendar a aula');
          }
          return;
        }
        Alert.alert('Sucesso', 'Aula agendada com sucesso!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/aulas') },
        ]);
      };

      if (allowedSet.length === 2) {
        const chosen = paymentSelection[originalId];
        if (!chosen) {
          setReviewAula(aula);
          setReviewMethod('totalpass');
          setReviewVisible(true);
          return;
        } else {
          await finalize(chosen);
          return;
        }
      } else if (allowedSet.length === 1) {
        const method = allowedSet[0];
        await finalize(method);
        return;
      } else {
        await finalize(paymentMethod);
        return;
      }
    } catch (e: any) {
      debugLog('enroll:error', { message: e?.message });
      Alert.alert('Erro', e.message || 'Não foi possível agendar a aula');
    }
  };

  const openPaymentReview = (aula: AulaItem) => {
    const originalId = /-\d{4}-\d{2}-\d{2}$/.test(aula.id) ? aula.id.slice(0, -11) : aula.id;
    const acceptsTP = aula.aceita_totalpass === true;
    const acceptsWH = aula.aceita_wellhub === true;
    const allowedSet = [acceptsTP ? 'totalpass' : null, acceptsWH ? 'wellhub' : null].filter(Boolean) as ('totalpass' | 'wellhub')[];
    setReviewAula(aula);
    setReviewMethod(allowedSet[0] || 'nao');
    setReviewVisible(true);
  };

  const formatDisplayDate = (dateStr: string): string => {
    try {
      const d = dateStr.includes('T') ? new Date(dateStr) : parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(d, 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  const classDateTimeInUTC = (dateStr: string, timeStr: string): Date => {
    const parts = (timeStr || '').split(':');
    const hh = (parts[0] || '00').padStart(2, '0');
    const mm = (parts[1] || '00').padStart(2, '0');
    const iso = `${dateStr}T${hh}:${mm}:00-03:00`;
    return new Date(iso);
  };

  const convertToBrasiliaDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const brasilia = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(d);
    return brasilia; // YYYY-MM-DD
  };

  const isBookingOpenTwoDaysBefore = (classDate: string): boolean => {
    const start = classDateTimeInUTC(classDate, '00:00');
    const cutoff = new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000);
    return new Date() >= cutoff;
  };

  const handlePickerChange = (event: any, d?: Date) => {
    if (Platform.OS === 'android') {
      if (event?.type === 'dismissed') {
        setShowPicker(false);
        return;
      }
      if (event?.type === 'set' && d && selectedArenaId) {
        const stored = format(d, 'yyyy-MM-dd');
        setSelectedDate(stored);
        loadClassesForDate(selectedArenaId, stored);
        setShowPicker(false);
        return;
      }
    } else {
      if (d && selectedArenaId) {
        const stored = format(d, 'yyyy-MM-dd');
        setSelectedDate(stored);
        loadClassesForDate(selectedArenaId, stored);
        setShowPicker(false);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agendar Aula</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Escolha uma Arena</Text>
        <View style={styles.searchRow}>
          <MapPin color="#6B7280" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar arena..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {loadingArenas ? (
          <ActivityIndicator style={{ marginTop: 12 }} color="#1E3A8A" />
        ) : (
          <View style={styles.arenaList}>
            {filteredArenas.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.arenaItem, selectedArenaId === a.id && styles.arenaItemActive]}
                onPress={() => setSelectedArenaId(a.id)}
              >
                <Text style={styles.arenaName}>{a.nome}</Text>
                <Text style={styles.arenaCity}>{a.endereco_cidade || ''}</Text>
              </TouchableOpacity>
            ))}
            {filteredArenas.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma arena encontrada</Text>
            )}
          </View>
        )}
      </View>

      {selectedArenaId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione uma data</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              {selectedDate ? formatDisplayDate(selectedDate) : 'Nenhuma data selecionada'}
            </Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
              <Text style={styles.dateButtonText}>Selecionar</Text>
            </TouchableOpacity>
          </View>
      {showPicker && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowPicker(false)} />
          <View style={styles.modalCard}>
            <DateTimePicker
              value={selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : new Date()}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'inline'}
              minimumDate={startOfDay(new Date())}
              onChange={handlePickerChange}
            />
          </View>
        </View>
      )}
          <Modal transparent visible={reviewVisible && !!reviewAula} animationType="slide" onRequestClose={() => setReviewVisible(false)}>
            <View style={[styles.modalOverlay, { zIndex: 1000 }] }>
              <TouchableOpacity style={[styles.overlayBg, { zIndex: 1000 }]} onPress={() => setReviewVisible(false)} />
              <View style={[styles.modalCard, { elevation: 8, zIndex: 1001 }]}>
                {reviewAula && (
                  <>
                    <Text style={styles.sectionTitle}>Revisar Pagamento</Text>
                    <Text style={{ marginTop: 8, color: '#374151' }}>{reviewAula.titulo}</Text>
                    <Text style={{ color: '#6B7280' }}>{formatDisplayDate(reviewAula.data)} • {reviewAula.horario}</Text>
                    <View style={{ height: 8 }} />
                <Text style={{ color: '#374151' }}>Selecione o método de pagamento:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {reviewAula.aceita_totalpass && (
                    <TouchableOpacity
                      style={[styles.modeChip, reviewMethod === 'totalpass' && styles.modeChipActive]}
                      onPress={() => setReviewMethod('totalpass')}
                    >
                      <Text style={{ color: reviewMethod === 'totalpass' ? '#1E3A8A' : '#374151' }}>TotalPass</Text>
                    </TouchableOpacity>
                  )}
                  {reviewAula.aceita_wellhub && (
                    <TouchableOpacity
                      style={[styles.modeChip, reviewMethod === 'wellhub' && styles.modeChipActive]}
                      onPress={() => setReviewMethod('wellhub')}
                    >
                      <Text style={{ color: reviewMethod === 'wellhub' ? '#1E3A8A' : '#374151' }}>Wellhub</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modeChip, reviewMethod === 'pix' && styles.modeChipActive]}
                    onPress={() => setReviewMethod('pix')}
                  >
                    <Text style={{ color: reviewMethod === 'pix' ? '#1E3A8A' : '#374151' }}>Pix</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeChip, reviewMethod === 'cartao' && styles.modeChipActive]}
                    onPress={() => setReviewMethod('cartao')}
                  >
                    <Text style={{ color: reviewMethod === 'cartao' ? '#1E3A8A' : '#374151' }}>Cartão</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeChip, reviewMethod === 'creditos' && styles.modeChipActive]}
                    onPress={() => setReviewMethod('creditos')}
                  >
                    <Text style={{ color: reviewMethod === 'creditos' ? '#1E3A8A' : '#374151' }}>Créditos</Text>
                  </TouchableOpacity>
                  {!reviewAula.aceita_totalpass && !reviewAula.aceita_wellhub && (
                    <Text style={{ color: '#6B7280' }}>Programa não aplicável</Text>
                  )}
                </View>
                <View style={{ height: 12 }} />
                {typeof reviewAula.preco === 'number' && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: '#374151', fontWeight: '700' }}>Resumo</Text>
                    <Text style={{ color: '#6B7280' }}>Preço da aula: R$ {Number(reviewAula.preco || 0).toFixed(2)}</Text>
                    {capacityByClass[(reviewAula.id.includes('-') ? reviewAula.id.slice(0, -11) : reviewAula.id)] && (
                      <Text style={{ color: '#6B7280' }}>
                        Máx. {capacityByClass[(reviewAula.id.includes('-') ? reviewAula.id.slice(0, -11) : reviewAula.id)]!.max_alunos} alunos • {capacityByClass[(reviewAula.id.includes('-') ? reviewAula.id.slice(0, -11) : reviewAula.id)]!.vagas_disponiveis} vagas
                      </Text>
                    )}
                  </View>
                )}
                <View style={{ height: 12 }} />
                <View style={{ gap: 4 }}>
                  <Text style={{ color: '#374151', fontWeight: '700' }}>Regras</Text>
                  <Text style={{ color: '#6B7280' }}>• Agendamento abre 2 dias antes do dia da aula</Text>
                  <Text style={{ color: '#6B7280' }}>• 1 aula por dia na mesma arena</Text>
                  <Text style={{ color: '#6B7280' }}>• Aula pode lotar; entre na lista de espera</Text>
                  {reviewAula.nivel && <Text style={{ color: '#6B7280' }}>• Nível necessário: {reviewAula.nivel}</Text>}
                </View>
                <View style={{ height: 12 }} />
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 0 }]}
                  onPress={() => {
                    const originalId = /-\d{4}-\d{2}-\d{2}$/.test(reviewAula.id) ? reviewAula.id.slice(0, -11) : reviewAula.id;
                    if (reviewMethod === 'pix' || reviewMethod === 'cartao' || reviewMethod === 'creditos') {
                      setReviewVisible(false);
                      const effectiveDate = reviewAula.data.includes('T') ? reviewAula.data.split('T')[0] : reviewAula.data;
                      const targetDate = convertToBrasiliaDate(`${effectiveDate}T00:00:00`);
                      router.push(`/(protected)/aulas/checkout?aid=${originalId}&date=${targetDate}&method=${reviewMethod}&price=${reviewAula.preco || 0}&title=${encodeURIComponent(reviewAula.titulo)}`);
                    } else {
                      setPaymentSelection(prev => ({ ...prev, [originalId]: reviewMethod as any }));
                      setReviewVisible(false);
                      handleEnroll(reviewAula);
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>Confirmar</Text>
                </TouchableOpacity>
                </>)}
              </View>
            </View>
          </Modal>
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Horários disponíveis</Text>
          {loadingClasses ? (
            <View style={styles.skeletonList}>
              {[1,2].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: '60%' }]} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.classList}>
              {classes.map((c) => (
                <View key={c.id} style={styles.classCard}>
                  <View style={styles.classRow}>
                    <Calendar color="#6B7280" size={16} />
                    <Text style={styles.classText}>{formatDisplayDate(c.data)} • {c.horario}</Text>
                  </View>
                  <Text style={styles.classTitle}>{c.titulo}</Text>
                  
                  {(
                    <View style={styles.classRow}>
                      <Users color="#6B7280" size={16} />
                      <Text style={styles.classText}>
                        Máx. {(capacityByClass[(c.id.includes('-') ? c.id.slice(0, -11) : c.id)]?.max_alunos) ?? (c.max_alunos ?? 0)} alunos
                        {typeof capacityByClass[(c.id.includes('-') ? c.id.slice(0, -11) : c.id)]?.vagas_disponiveis === 'number' &&
                          ` • ${capacityByClass[(c.id.includes('-') ? c.id.slice(0, -11) : c.id)]!.vagas_disponiveis} vagas`}
                      </Text>
                    </View>
                  )}
                  {capacityByClass[(c.id.includes('-') ? c.id.slice(0, -11) : c.id)]?.is_full && (
                    <Text style={styles.fullText}>Sem vagas</Text>
                  )}
                  <TouchableOpacity style={styles.primaryButton} onPress={() => openPaymentReview(c)}>
                    <Text style={styles.primaryButtonText}>Agendar</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {classes.length === 0 && (
                <Text style={styles.emptyText}>Nenhuma aula disponível</Text>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  section: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  navButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  navText: { color: '#111827', fontSize: 16 },
  modeToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  weekCell: { width: '13%', alignItems: 'center' },
  weekText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCell: { width: '13%', aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  dayCellDisabled: { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' },
  dayCellSelected: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  dayCellToday: { borderColor: '#1E3A8A' },
  dayText: { color: '#111827', fontSize: 14, fontWeight: '600' },
  dayTextDisabled: { color: '#9CA3AF' },
  dayTextSelected: { color: '#FFFFFF' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E3A8A', marginTop: 4 },
  dotSelected: { backgroundColor: '#FFFFFF' },
  modeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', color: '#374151', backgroundColor: '#FFFFFF' },
  modeChipActive: { borderColor: '#1E3A8A', color: '#1E3A8A', backgroundColor: '#EFF6FF', fontWeight: '700' },
  skeletonList: { marginTop: 12, gap: 12 },
  skeletonCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', gap: 8 },
  skeletonLine: { height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, width: '80%' },
  fullText: { color: '#DC2626', fontWeight: '700', marginTop: 6 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  arenaList: { marginTop: 12 },
  arenaItem: {
    padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    marginBottom: 8, backgroundColor: '#FFFFFF',
  },
  arenaItemActive: { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' },
  arenaName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  arenaCity: { fontSize: 13, color: '#6B7280' },
  classList: { marginTop: 12 },
  classCard: { padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 12, backgroundColor: '#FFFFFF' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classText: { fontSize: 14, color: '#6B7280' },
  classTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginVertical: 8 },
  classSub: { fontSize: 13, color: '#6B7280' },
  primaryButton: { marginTop: 12, backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  dateText: { fontSize: 16, color: '#111827', fontWeight: '600' },
  dateButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1E3A8A' },
  dateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  overlayBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  modalCard: { borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
});
