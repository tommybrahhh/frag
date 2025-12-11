'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Memoize the supabase client to ensure stability across renders,
  // though createClient handles singleton logic internally for the browser.
  // If environment variables are missing, supabase will be null.
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (error) {
      console.warn('Supabase client initialization failed:', error);
      return null;
    }
  }, []);

  const fetchUserProfile = useCallback(async (sessionUser: any) => {
    if (!supabase) {
      // If supabase is not available, return user without profile
      return {
        ...sessionUser,
        display_name: sessionUser.email?.split('@')[0]
      };
    }
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', sessionUser.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return {
          ...sessionUser,
          display_name: sessionUser.email?.split('@')[0]
        };
      }
      
      return {
        ...sessionUser,
        display_name: profile?.display_name || sessionUser.email?.split('@')[0]
      };
    } catch (error) {
      console.error('Error in profile fetch:', error);
      return {
        ...sessionUser,
        display_name: sessionUser.email?.split('@')[0]
      };
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      // If supabase is not available, skip authentication and set loading to false
      setLoading(false);
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const userWithProfile = await fetchUserProfile(session.user);
          if (mounted) setUser(userWithProfile);
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only update if the session user actually changed to avoid redundant fetches
      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user);
        if (mounted) setUser(userWithProfile);
      } else if (mounted) {
        setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push('/');
    router.refresh();
  }, [supabase, router]);

  const value = useMemo(() => ({
    user,
    loading,
    signOut
  }), [user, loading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);