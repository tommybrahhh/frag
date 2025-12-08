'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // SIGN UP LOGIC
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Account created! check your email to confirm.');
      } else {
        // SIGN IN LOGIC
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/'); // Redirect to home
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6">
      
      {/* Home Link */}
      <Link href="/" className="absolute top-6 left-6 text-xs font-bold tracking-widest text-stone-400 uppercase hover:text-stone-900">
        ← Return Home
      </Link>

      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-stone-900 mb-2">
            {isSignUp ? 'Join the Club' : 'Welcome Back'}
          </h1>
          <p className="text-stone-500 text-sm">
            {isSignUp ? 'Create your olfactory profile' : 'Sign in to access your collection'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-stone-800 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-stone-800 outline-none transition"
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
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New here? Create an Account'}
          </button>
        </div>
      </div>
    </div>
  );
}