import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    nome: string,
    telefone?: string,
    consentData?: Record<string, boolean>,
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    nome: string,
    telefone?: string,
    consentData?: Record<string, boolean>,
  ) => {
    const redirectUrl = Linking.createURL('/');
    const data: Record<string, unknown> = {
      nome,
      telefone,
      ...consentData,
    };
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data,
      },
    });

    // Se o cadastro foi bem-sucedido e o usuário foi criado, criar o perfil
    if (!error && signUpData.user) {
      try {
        await supabase.from('profiles').insert({
          user_id: signUpData.user.id,
          nome: nome,
          telefone: telefone || null,
          consents_version: '1.0',
          privacy_accepted: false,
          terms_accepted: false,
          image_consent_accepted: false,
          plano: 'gratuito',
        });
      } catch (profileError) {
        // Se der erro ao criar perfil, não falha o cadastro
        console.error('Erro ao criar perfil:', profileError);
      }
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectTo = Linking.createURL('/(protected)/feed');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


