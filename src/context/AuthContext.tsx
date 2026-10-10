import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  hasProfileRecord: boolean;
  role: UserRole;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; isEmailNotConfirmed?: boolean }>;
  signUp: (email: string, password: string, metadata: { full_name: string; role: UserRole; phone?: string }) => Promise<{ error: Error | null; isEmailConfirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasProfileRecord, setHasProfileRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(isSupabaseConfigured());

  const supabase = getSupabaseClient();

  const fetchProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured()) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profiles query error or restricted:', error.message);
      }

      if (data) {
        setProfile(data as Profile);
        setHasProfileRecord(true);
      } else {
        // No row in profiles table yet for this auth.user
        setProfile(null);
        setHasProfileRecord(false);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      setHasProfileRecord(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setConfigured(isSupabaseConfigured());
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      } catch (err) {
        console.warn('Supabase getSession failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const isNotConfirmed = error.message?.toLowerCase().includes('email not confirmed');
        return { error: error as Error, isEmailNotConfirmed: isNotConfirmed };
      }
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      const isNotConfirmed = err?.message?.toLowerCase().includes('email not confirmed');
      return { error: err, isEmailNotConfirmed: isNotConfirmed };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { full_name: string; role: UserRole; phone?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            role: metadata.role,
            phone: metadata.phone,
          },
        },
      });

      if (error) return { error: error as Error };

      const isConfirmationRequired = !data.session;
      return { error: null, isEmailConfirmationRequired: isConfirmationRequired };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setHasProfileRecord(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('User not logged in') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }
      return { error: error as Error | null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const effectiveRole: UserRole = profile?.role || (user?.user_metadata?.role as UserRole) || 'Mpianatra';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        hasProfileRecord,
        role: effectiveRole,
        loading,
        isConfigured: configured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
