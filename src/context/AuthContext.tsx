'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  supabase: SupabaseClient | undefined; // Supabase client might be undefined if initialization fails
  supabaseInitError: string | null; // New state for initialization errors
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  supabase: undefined, // Default to undefined
  supabaseInitError: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseInitError, setSupabaseInitError] = useState<string | null>(null);
  const router = useRouter();
  
  // Initialize the browser client once, catching any errors
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (error: any) {
      console.error("Error initializing Supabase client:", error.message);
      setSupabaseInitError(error.message);
      return undefined; // Return undefined if client creation fails
    }
  }, []);

  // Fetch user profile logic (separated for clarity)
  const fetchUserProfile = useCallback(async (sessionUser: any) => {
    if (!supabase) { // Check if supabase client is available
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
          display_name: profile?.display_name || sessionUser.email?.split('@')[0]
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
      // If supabase client failed to initialize, prevent further calls
      if (supabaseInitError || !supabase) {
        if (mounted) setLoading(false);
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
    let subscription: any; // Define subscription variable here

    if (supabase) { // Only subscribe if supabase client is initialized
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (mounted) {
            if (session?.user) {
                const userWithProfile = await fetchUserProfile(session.user);
                setUser(userWithProfile);
            } else {
                setUser(null);
            }
            setLoading(false);
            router.refresh(); // Refresh server components when auth state changes
        }
        });
        subscription = sub; // Assign the subscription
    }
    

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, router, fetchUserProfile, supabaseInitError]);

  const signOut = useCallback(async () => {
    if (!supabase) return; // Prevent signOut if client not initialized
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }, [supabase, router]);

  const value = useMemo(() => ({
    user,
    loading,
    signOut,
    supabase,
    supabaseInitError,
  }), [user, loading, signOut, supabase, supabaseInitError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);