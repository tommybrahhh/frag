'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="w-8 h-8 bg-stone-100 rounded-full animate-pulse" />;
  }

  if (user) {
    return (
      <Link 
        href="/profile" 
        className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-900 hover:border-stone-400 transition-all overflow-hidden"
      >
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span>{user.email?.[0].toUpperCase()}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition shadow-sm"
    >
      Sign In
    </Link>
  );
}
