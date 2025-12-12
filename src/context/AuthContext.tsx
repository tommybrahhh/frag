'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
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
      const client = createClient();
      console.log('Supabase client initialized:', {
        configured: isSupabaseConfigured,
        hasSessionMethod: typeof client?.auth?.getSession === 'function'
      });
      return client;
    } catch (error) {
      console.warn('Supabase client initialization failed:', error);
      return null;
    }
  }, []);

  const fetchUserProfile = useCallback(async (sessionUser: any) => {
    if (!supabase || !isSupabaseConfigured) {
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
    console.log('🔄 AuthContext useEffect triggered', {
      isSupabaseConfigured,
      supabaseClientExists: !!supabase,
      hasAuthMethods: supabase?.auth ? true : false
    });
    
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured. Authentication is disabled.');
      setLoading(false);
      return;
    }

    if (!supabase) {
      console.warn('Supabase client not available in AuthContext');
      setLoading(false);
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get timeout from environment variable or use default (30s)
        const timeoutDuration = process.env.NEXT_PUBLIC_AUTH_TIMEOUT
          ? parseInt(process.env.NEXT_PUBLIC_AUTH_TIMEOUT, 10)
          : 30000;

        // 1. Create a promise that rejects after a timeout
        const timeoutPromise = new Promise((_, reject) => {
          const id = setTimeout(() => {
            reject(new Error(`Authentication timed out after ${timeoutDuration}ms`));
          }, timeoutDuration);
        });

        // 2. Race Supabase against the timeout
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as any; // Type casting for the race result

        if (error) throw error;

        // 3. Handle success
        if (data?.session) {
          setUser(data.session.user);
          // Optional: fetch user profile here if needed
        } else {
          setUser(null);
        }

      } catch (error: any) {
        if (error.message && error.message.includes('timed out')) {
          console.warn("Auth initialization:", error.message);
        } else {
          console.error("Auth initialization error:", error);
        }
        
        // IMPORTANT: On error, assume logged out so the UI appears
        setUser(null);
        
      } finally {
        // CRITICAL: This must run to remove the blank screen/loading spinner
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only update if the session user actually changed to avoid redundant fetches
      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user);
        if (mounted) {
          setUser(userWithProfile);
          // Ensure the state is updated before resolving
          await new Promise(resolve => setTimeout(resolve, 100));
        }
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