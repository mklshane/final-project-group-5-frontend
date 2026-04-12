import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  currency: string | null;
  balance: number | null;
  onboarding_done: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const normalizeAuthErrorMessage = (message: string | null | undefined) => {
  if (!message) return 'Unable to sign in right now. Please try again.';

  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('user not found')) {
    return 'Incorrect email or password.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  return message;
};

const normalizeSignUpErrorMessage = (message: string | null | undefined) => {
  if (!message) return null;

  const msg = message.toLowerCase();
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return 'This email is already registered. Sign in instead, or delete it from Supabase Authentication if you need to reuse it.';
  }

  return message;
};

const fetchProfile = async (accessToken: string): Promise<Profile | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      await res.json().catch(() => ({}));
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
};

const fetchProfileWithRetry = async (accessToken: string, retries = 3): Promise<Profile | null> => {
  for (let i = 0; i < retries; i++) {
    const profile = await fetchProfile(accessToken);
    if (profile) return profile;
    if (i < retries - 1) await new Promise(r => setTimeout(r, 1500));
  }
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        fetchProfileWithRetry(session.access_token).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
        const p = await fetchProfileWithRetry(session.access_token);
        setProfile(p);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password });
      if (error) {
        return { error: normalizeAuthErrorMessage(error.message) };
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        await supabase.auth.signOut();
        return { error: 'Unable to start your session. Please try again.' };
      }

      const signedInProfile = await fetchProfile(accessToken);
      if (!signedInProfile) {
        await supabase.auth.signOut();
        return { error: 'Your account is missing a profile record. Please contact support or sign up again.' };
      }

      setProfile(signedInProfile);
      return { error: null };

    } catch {
      return { error: 'Network issue while signing in. Please check your connection and try again.' };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: normalizeSignUpErrorMessage(error?.message) };
  };

  const signInWithGoogle = async () => {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'budgy', path: 'google-auth' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });
    if (error || !data.url) return { error: error?.message ?? 'OAuth failed' };
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type === 'success' && result.url) {
      const params = new URLSearchParams(result.url.split('#')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const p = await fetchProfile(session.access_token);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
