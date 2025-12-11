'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import SearchBar from './SearchBar';

export default function GlobalHeader() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Left: Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="font-serif text-xl text-stone-900 tracking-tight">
            Perfume Intuition
          </span>
        </Link>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl">
          <SearchBar />
        </div>

        {/* Right: Auth Links */}
        <div className="flex-shrink-0">
          {loading ? (
             <div className="w-24 h-9 bg-stone-200 animate-pulse rounded-full" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors"
              >
                My Shelf
              </Link>
              <button
                onClick={signOut}
                className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition shadow-lg"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}