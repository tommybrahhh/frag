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
      console.log('🔐 Initializing auth...');
      try {
        // Safety timeout: If Supabase takes too long (e.g., network hang), stop loading
        const timeoutPromise = new Promise((_, reject) => {
          const timeoutId = setTimeout(() => {
            console.log('🕒 Auth timeout triggered (10s) - Client status:', {
              configValid: isSupabaseConfigured,
              hasAuthMethods: !!supabase?.auth,
              supabaseReady: !!supabase?.auth?.getSession,
              timeSinceMount: Date.now() - window.performance.timeOrigin
            });
            reject(new Error('Auth timeout after 10 seconds'));
          }, 10000);

          console.log('⏳ Auth timeout timer started (10s)');
          return () => {
            clearTimeout(timeoutId);
            console.log('🧹 Cleared auth timeout timer');
          };
        });

        console.log('🔍 Starting auth session check...', {
          supabaseReady: !!supabase?.auth?.getSession
        });
        const sessionPromise = supabase.auth.getSession();
        
        // Race the session fetch against the timeout
        const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        console.log('✅ Auth session check completed', {
          sessionExists: !!data?.session,
          userExists: !!data?.session?.user,
          authMethod: data?.session?.user?.app_metadata?.provider,
          mountedState: mounted
        });
        const session = data?.session;
        
        if (session?.user && mounted) {
          const userWithProfile = await fetchUserProfile(session.user);
          if (mounted) setUser(userWithProfile);
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        // On timeout or error, ensure we don't leave the user stuck
        if (mounted) setUser(null); 
      } finally {
        if (mounted) setLoading(false);
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