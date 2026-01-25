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
      <div className="flex items-center gap-4">
        {/* User is logged in. Add user menu/actions here in the future. */}
      </div>
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
