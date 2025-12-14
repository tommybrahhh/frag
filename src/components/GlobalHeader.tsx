'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import SearchBar from './SearchBar';

export default function GlobalHeader() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sm:gap-6">
        {/* Left: Logo */}
        <Link href="/" className="flex-shrink-0">
          <img
            src="/window.svg"
            alt="Home"
            className="h-8 w-8"
          />
        </Link>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl mx-2">
          <SearchBar />
        </div>

        {/* Right: Auth Links */}
       <div className="flex-shrink-0 flex items-center gap-3 sm:gap-6 overflow-visible">
         {/* Common Links - Always Visible */}
         <Link
           href="/layering"
           className="text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors"
         >
           Layering
         </Link>
         <Link
           href="/quiz"
           className="text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors"
         >
           Quiz
         </Link>

         {/* Auth Dependent Links */}
         {loading ? (
            <div className="w-24 h-9 bg-stone-200 animate-pulse rounded-full" />
         ) : user ? (
           <>
             <Link
               href="/profile"
               className="text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors"
             >
               My Shelf
             </Link>
             <button
               onClick={signOut}
               className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100"
             >
               Sign Out
             </button>
           </>
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