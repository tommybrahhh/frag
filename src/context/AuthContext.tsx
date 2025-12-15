'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  supabase: ReturnType<typeof createClient>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  supabase: createClient()
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Initialize the browser client once with error handling
  const supabase = useMemo(() => createClient(), []);

  // Fetch user profile logic (separated for clarity)
  const fetchUserProfile = useCallback(async (sessionUser: any) => {
    // Safety check: if supabase failed to load, just return the basic user
    if (!supabase) {
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
    let mounted = true;

    // 1. Check active session on mount
    const checkUser = async () => {
      // Add safety check for missing client
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
           if (session?.user) {
             const userWithProfile = await fetchUserProfile(session.user);
             setUser(userWithProfile);
           } else {
             setUser(null);
           }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    // 2. Listen for auth changes (login, logout, token refresh)
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session?.user) {
          // Optimization: If we already have the user and IDs match, might not need full profile fetch,
          // but fetching ensures we have the latest display name.
          const userWithProfile = await fetchUserProfile(session.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
        router.refresh(); // Refresh server components when auth state changes
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, fetchUserProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }, [supabase, router]);

  const value = useMemo(() => ({
    user,
    loading,
    signOut,
    supabase
  }), [user, loading, signOut, supabase]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);