'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
  const supabase = createClient();

  useEffect(() => {
    // 1. Check active session on load and fetch profile
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          // Fetch user profile with nickname
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Still set user but without profile data
            setUser({
              ...session.user,
              display_name: session.user.email?.split('@')[0]
            });
          } else {
            setUser({
              ...session.user,
              display_name: profile?.display_name || session.user.email?.split('@')[0]
            });
          }
        } catch (error) {
          console.error('Error in profile fetch:', error);
          setUser({
            ...session.user,
            display_name: session.user.email?.split('@')[0]
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();

    // 2. Listen for changes (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          // Fetch user profile with nickname
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Still set user but without profile data
            setUser({
              ...session.user,
              display_name: session.user.email?.split('@')[0]
            });
          } else {
            setUser({
              ...session.user,
              display_name: profile?.display_name || session.user.email?.split('@')[0]
            });
          }
        } catch (error) {
          console.error('Error in profile fetch:', error);
          setUser({
            ...session.user,
            display_name: session.user.email?.split('@')[0]
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);