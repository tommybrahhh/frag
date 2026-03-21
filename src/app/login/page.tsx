'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Use central auth context
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const runtime = "edge";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [localLoading, setLocalLoading] = useState(false); // Renamed to avoid conflict with auth loading
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  
  const { user, loading: authLoading, supabase } = useAuth(); // Get supabase from context

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      if (isSignUp) {
        // --- SIGN UP FLOW (Email OR Username) ---
        let emailToUse = identifier;
        let isUsername = !identifier.includes('@');

        if (isUsername) {
          // 1. Validate username format
          if (identifier.length < 3) {
            throw new Error('Username must be at least 3 characters long.');
          }
          if (/\s/.test(identifier)) {
            throw new Error('Username cannot contain spaces.');
          }

          // 2. Check if username is already taken in profiles table
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('display_name')
            .ilike('display_name', identifier)
            .maybeSingle();

          if (checkError) {
            console.error("Username check error:", checkError);
          }
          if (existingProfile) {
            throw new Error('This username is already taken. Please choose another.');
          }

          // 3. Generate synthetic email for Supabase Auth
          emailToUse = `${identifier.toLowerCase()}@temp.fragrance.club`;
        }

        const { error } = await supabase.auth.signUp({
          email: emailToUse,
          password,
          options: {
            data: {
              display_name: isUsername ? identifier : identifier.split('@')[0],
            }
          }
        });
        if (error) throw error;
        
        if (isUsername) {
          setMessage('Account created! You can now sign in.');
        } else {
          setMessage('Account created! Check your email to confirm if required.');
        }
        
        setIdentifier('');
        setPassword('');
        
      } else {
        // --- LOGIN FLOW (Email OR Username) ---
        let emailToUse = identifier;

        // 1. If it doesn't look like an email, treat it as a Username
        if (!identifier.includes('@')) {
          const { data: lookedUpEmail, error: lookupError } = await supabase
            .rpc('get_email_by_username' as any, { username_input: identifier } as any) as any;

          if (lookupError) {
             console.error("Username lookup failed:", lookupError);
             throw new Error('Unable to sign in with username. Please use your email address.');
          }
          if (!lookedUpEmail) {
            throw new Error('Username not found.');
          }
          emailToUse = lookedUpEmail;
        }

        // 2. Perform actual Login
        const { error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });
        
        if (error) throw error;
        
        setMessage('Login successful! Redirecting...');
        
        // Removed router.refresh() to avoid conflict with AuthContext
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  if (authLoading) return null; // Prevent flicker while checking session

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 pt-24">
      
      <Link href="/" className="absolute top-24 left-6 text-xs font-bold tracking-widest text-stone-800 uppercase hover:text-stone-900">
        ← Return Home
      </Link>

      <div className="w-full max-w-md bg-white p-4 sm:p-8 rounded-3xl border border-stone-200 shadow-xl mx-4 sm:mx-0 overflow-x-hidden">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-stone-900 mb-2">
            {isSignUp ? 'Join the Club' : 'Welcome Back'}
          </h1>
          <p className="text-stone-700 text-sm">
            {isSignUp ? 'Create your olfactory profile' : 'Sign in to access your collection'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-800 block mb-2">
              Email or Username
            </label>
            <input
            type="text" 
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-stone-800 outline-none transition text-black"
            placeholder="Email or Username"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-800 block mb-2">Password</label>
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-stone-800 outline-none transition text-black"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-red-500 text-xs text-center">{error}</div>}
          {message && <div className="text-emerald-600 text-xs text-center">{message}</div>}

          <button
            type="submit"
            disabled={localLoading}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition disabled:opacity-50"
          >
            {localLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-xs text-stone-700 hover:text-stone-900 underline underline-offset-4"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New here? Create an Account'}
          </button>
        </div>
      </div>
    </div>
  );
}