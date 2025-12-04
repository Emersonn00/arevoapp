import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
//
import { useStripe } from '@stripe/stripe-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase/client';

export default function CheckoutAulaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ aid?: string; date?: string; method?: string; price?: string; title?: string }>();
  const aulaId = params.aid || '';
  const date = params.date || '';
  const method = (params.method || 'pix') as 'pix' | 'cartao' | 'creditos';
  const price = Number(params.price || '0');
  const title = params.title || '';

  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pendente' | 'pago' | 'falha' | 'cancelado'>('pendente');
  const [canConfirm, setCanConfirm] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    const init = async () => {
      try {
        // Ensure user session
        const { data: authRes } = await supabase.auth.getUser();
        const authUid = authRes?.user?.id || null;
        if (!authUid) {
          Alert.alert('Sessão expirada', 'Faça login novamente');
          return;
        }
        // Create or keep a pending payment row
        await (supabase as any)
          .from('pagamentos_aulas')
          .upsert(
            {
              user_id: authUid,
              aula_id: aulaId,
              data_aula: date,
              forma_pagamento: method,
              valor: price,
              status: 'pendente',
            },
            { onConflict: 'aula_id, data_aula, user_id' }
          );

        // Fetch credits balance if needed
        if (method === 'creditos') {
          const { data: prof } = await (supabase as any)
            .from('profiles')
            .select('creditos_saldo')
            .maybeSingle();
          if (prof && typeof prof.creditos_saldo === 'number') {
            setBalance(prof.creditos_saldo);
          }
        }

        if (method === 'pix') {
          setQrUrl(
            'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' +
              encodeURIComponent(`${aulaId}|${date}|${price}`)
          );
        }

        // Start polling for payment status
        pollRef.current = setInterval(async () => {
          const { data, error } = await (supabase as any)
            .from('pagamentos_aulas')
            .select('status')
            .eq('user_id', authUid)
            .eq('aula_id', aulaId)
            .eq('data_aula', date)
            .maybeSingle();
          if (!error && data) {
            const st = (data.status as any) || 'pendente';
            setPaymentStatus(st);
            setCanConfirm(st === 'pago');
          }
        }, 2000);
      } catch (e: any) {
        Alert.alert('Erro', e?.message || 'Falha ao iniciar checkout');
      }
    };
    init();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [method, aulaId, date, price]);

  const markPaymentPaidDev = async () => {
    try {
      setLoading(true);
      const { data: authRes } = await supabase.auth.getUser();
      const authUid = authRes?.user?.id || null;
      if (!authUid) {
        Alert.alert('Sessão expirada', 'Faça login novamente');
        return;
      }
      await (supabase as any)
        .from('pagamentos_aulas')
        .update({ status: 'pago' })
        .eq('user_id', authUid)
        .eq('aula_id', aulaId)
        .eq('data_aula', date);
      Alert.alert('Pagamento confirmado', 'Você pode confirmar a inscrição agora');
      setPaymentStatus('pago');
      setCanConfirm(true);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao confirmar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const { data: authRes } = await supabase.auth.getUser();
      const authUid = authRes?.user?.id || null;
      if (!authUid) return;
      const { data } = await (supabase as any)
        .from('pagamentos_aulas')
        .select('status')
        .eq('user_id', authUid)
        .eq('aula_id', aulaId)
        .eq('data_aula', date)
        .maybeSingle();
      const st = ((data as any)?.status) || 'pendente';
      setPaymentStatus(st);
      setCanConfirm(st === 'pago');
    } catch {}
  };

  const confirmEnrollment = async () => {
    try {
      if (!canConfirm) {
        Alert.alert('Pagamento pendente', 'Finalize o pagamento antes de confirmar a inscrição');
        return;
      }
      setLoading(true);
      const { data: authRes } = await supabase.auth.getUser();
      const authUid = authRes?.user?.id || null;
      if (!authUid) {
        Alert.alert('Sessão expirada', 'Faça login novamente');
        return;
      }

      // Load profile for name/phone
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nome, telefone')
        .eq('user_id', authUid)
        .single();
      if (profileError) throw profileError;

      // Insert enrollment; DB enforces limits & capacity
      const { error: insertErr } = await supabase
        .from('inscricoes_aulas')
        .insert({
          aula_id: aulaId,
          user_id: authUid,
          data_aula: date,
          nome_aluno: profileData?.nome || 'Aluno',
          telefone_aluno: profileData?.telefone ?? '',
          aplicativo_bem_estar: 'nao',
        });

      if (insertErr) {
        const msg = insertErr.message || '';
        if (msg.includes('CLASS_FULL')) {
          Alert.alert('Aula lotada', 'Não há vagas disponíveis');
        } else if (msg.includes('ALREADY_SUBSCRIBED')) {
          Alert.alert('Já inscrito', 'Você já está inscrito nesta aula');
        } else if (msg.includes('ARENA_DAY_LIMIT')) {
          Alert.alert('Limite atingido', 'Você já possui um agendamento nesta arena para o dia');
        } else if (msg.includes('WEEKLY_LIMIT_REACHED')) {
          Alert.alert('Limite semanal', 'Limite de agendamentos semanais atingido');
        } else if (msg.includes('row-level security policy')) {
          Alert.alert('Erro', 'Permissão negada pela política de segurança');
        } else {
          Alert.alert('Erro', 'Não foi possível agendar a aula');
        }
        return;
      }

      Alert.alert('Sucesso', 'Aula agendada com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/aulas') },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao confirmar inscrição');
    } finally {
      setLoading(false);
    }
  };

  const cancelPayment = async () => {
    try {
      const { data: authRes } = await supabase.auth.getUser();
      const authUid = authRes?.user?.id || null;
      if (!authUid) {
        router.back();
        return;
      }
      await (supabase as any)
        .from('pagamentos_aulas')
        .update({ status: 'cancelado' })
        .eq('user_id', authUid)
        .eq('aula_id', aulaId)
        .eq('data_aula', date)
        .eq('status', 'pendente');
      setPaymentStatus('cancelado');
      router.back();
    } catch {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.title}>Checkout da Aula</Text>
        <Text style={styles.item}>Aula: {title}</Text>
        <Text style={styles.item}>Data: {date}</Text>
        <Text style={styles.item}>Forma de pagamento: {method.toUpperCase()}</Text>
        <Text style={styles.item}>Valor: R$ {price.toFixed(2)}</Text>
        {method === 'pix' && (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            {qrUrl && <Image source={{ uri: qrUrl }} style={{ width: 180, height: 180 }} />}
            <Text style={{ color: '#6B7280', marginTop: 6 }}>Escaneie o QR para pagar</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.button, styles.outline]} onPress={refreshStatus}>
                <Text style={[styles.buttonText, { color: '#1E3A8A' }]}>Verificar pagamento</Text>
              </TouchableOpacity>
              {__DEV__ && (
                <TouchableOpacity style={styles.button} onPress={markPaymentPaidDev} disabled={loading}>
                  <Text style={styles.buttonText}>{loading ? 'Processando...' : 'Pagar com Pix (dev)'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        {method === 'cartao' && (
          <View style={{ gap: 8, marginVertical: 12 }}>
            <Text style={{ color: '#6B7280' }}>Pagamento com cartão pelo app.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                try {
                  setLoading(true);
                  const { data: authRes } = await supabase.auth.getUser();
                  const authUid = authRes?.user?.id || null;
                  if (!authUid) {
                    Alert.alert('Sessão expirada', 'Faça login novamente');
                    return;
                  }
                  await (supabase as any)
                    .from('pagamentos_aulas')
                    .upsert(
                      {
                        user_id: authUid,
                        aula_id: aulaId,
                        data_aula: date,
                        forma_pagamento: method,
                        valor: price,
                        status: 'pendente',
                      },
                      { onConflict: 'aula_id, data_aula, user_id' }
                    );
                  const { data: intent, error } = await supabase.functions.invoke('create-payment-intent', {
                    body: {
                      amount: Math.round(price * 100),
                      currency: 'brl',
                      metadata: { user_id: authUid, aula_id: aulaId, data_aula: date },
                    },
                  });
                  if (error) throw error;
                  const clientSecret = (intent as any)?.client_secret;
                  if (!clientSecret) throw new Error('Falha ao criar pagamento');
                  const { error: initErr } = await initPaymentSheet({ paymentIntentClientSecret: clientSecret });
                  if (initErr) throw initErr;
                  const { error: presentErr } = await presentPaymentSheet();
                  if (presentErr) {
                    Alert.alert('Pagamento não concluído');
                    return;
                  }
                  await (supabase as any)
                    .from('pagamentos_aulas')
                    .update({ status: 'pago' })
                    .eq('user_id', authUid)
                    .eq('aula_id', aulaId)
                    .eq('data_aula', date);
                  setPaymentStatus('pago');
                  setCanConfirm(true);
                  Alert.alert('Pagamento confirmado');
                } catch (e: any) {
                  Alert.alert('Erro', e?.message || 'Falha no pagamento');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Processando...' : 'Pagar com Cartão'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {method === 'creditos' && (
          <View style={{ gap: 8, marginVertical: 12 }}>
            <Text style={{ color: '#6B7280' }}>Debitar créditos do seu saldo.</Text>
            {typeof balance === 'number' && (
              <Text style={{ color: '#6B7280' }}>Saldo: R$ {balance.toFixed(2)}</Text>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                try {
                  setLoading(true);
                  const { data: res, error } = await supabase.rpc('charge_credits_and_mark_paid' as any, {
                    p_aula_id: aulaId,
                    p_data_aula: date,
                  });
                  if (error) throw error;
                  const ok = (res as any)?.success === true;
                  if (ok) {
                    Alert.alert('Créditos debitados', 'Pagamento confirmado');
                    setPaymentStatus('pago');
                    setCanConfirm(true);
                    if (typeof balance === 'number') setBalance(Math.max(0, balance - price));
                  } else {
                    const err = (res as any)?.error || 'Falha ao debitar créditos';
                    if (err === 'INSUFFICIENT_CREDITS') {
                      Alert.alert('Créditos insuficientes', 'Você não possui saldo suficiente');
                    } else {
                      Alert.alert('Erro', String(err));
                    }
                  }
                } catch (e: any) {
                  Alert.alert('Erro', e?.message || 'Falha ao debitar créditos');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || (typeof balance === 'number' && balance < price)}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Processando...' : (typeof balance === 'number' && balance < price ? 'Saldo insuficiente' : 'Debitar Créditos')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 12 }} />
        <Text style={{ color: paymentStatus === 'pago' ? '#059669' : paymentStatus === 'cancelado' ? '#6B7280' : '#DC2626', fontWeight: '700' }}>
          Status: {paymentStatus.toUpperCase()}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <TouchableOpacity style={[styles.button, styles.outline]} onPress={cancelPayment}>
            <Text style={[styles.buttonText, { color: '#1E3A8A' }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={confirmEnrollment} disabled={loading || !canConfirm}>
            <Text style={styles.buttonText}>{loading ? 'Processando...' : 'Confirmar Inscrição'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  item: { fontSize: 14, color: '#374151', marginTop: 4 },
  button: { flex: 1, backgroundColor: '#1E3A8A', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  outline: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#1E3A8A' },
});
