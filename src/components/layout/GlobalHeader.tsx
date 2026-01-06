'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/features/search/SearchBar';

export default function GlobalHeader() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-[999] w-full border-b border-stone-100 bg-white/80 backdrop-blur-md transition-all duration-300">
      {/* Changed max-w-7xl to max-w-[1400px] to match page content */}
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
        
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="bg-stone-900 text-white p-2 rounded-lg group-hover:bg-stone-800 transition">
              <Image
                src="/logo.svg"
                alt="Scentia"
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </div>
            <span className="font-serif text-xl font-medium tracking-tight text-stone-900">Scentia</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/profile" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Shelf
            </Link>
            <Link href="/layering" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Layering
            </Link>
            <Link href="/search" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Notes
            </Link>
            <Link href="/compare" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Compare
            </Link>
            <Link href="/quiz" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Quiz
            </Link>
          </nav>
        </div>

        {/* Center: Search Bar - Expanded width */}
        <div className="hidden md:block flex-1 w-[75%] mx-4">
          <SearchBar />
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-6 md:gap-8">
          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {loading ? (
                <div className="w-8 h-8 bg-stone-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Search Bar - Visible only on small screens */}
      <div className="md:hidden px-6 pb-4">
        <SearchBar />
      </div>
    </header>
  );
}