'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  // Renamed 'email' to 'identifier' to reflect it can be either
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // NEW: Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // --- SIGN UP FLOW (Strictly Email) ---
        if (!identifier.includes('@')) {
          throw new Error('Please use a valid email address to sign up.');
        }

        const { error } = await supabase.auth.signUp({
          email: identifier,
          password,
        });
        if (error) throw error;
        setMessage('Account created! Check your email to confirm.');
        // Clear form after successful signup
        setIdentifier('');
        setPassword('');
        
      } else {
        // --- LOGIN FLOW (Email OR Username) ---
        let emailToUse = identifier;

        // 1. If it doesn't look like an email, treat it as a Username
        if (!identifier.includes('@')) {
          const { data: lookedUpEmail, error: lookupError } = await supabase
            .rpc('get_email_by_username', { username_input: identifier });

          if (lookupError) throw lookupError;
          if (!lookedUpEmail) {
            throw new Error('Username not found.');
          }
          emailToUse = lookedUpEmail;
        }

        // 2. Perform actual Login
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });
        
        if (error) throw error;
        
        setMessage('Login successful! Redirecting...');
        
        // Force a full page reload to ensure all states (AuthContext, Server Components) are perfectly synced.
        // This resolves issues where client-side navigation leaves the UI in a stale "logged out" state.
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 pt-24">
      
      <Link href="/" className="absolute top-24 left-6 text-xs font-bold tracking-widest text-stone-800 uppercase hover:text-stone-900">
        ← Return Home
      </Link>

      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200 shadow-xl">
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
              {isSignUp ? 'Email Address' : 'Email or Username'}
            </label>
            <input
            type="text" // Changed from 'email' to 'text' to allow usernames
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-stone-800 outline-none transition text-black"
            placeholder={isSignUp ? "you@example.com" : "Email or Display Name"}
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
            disabled={loading}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
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