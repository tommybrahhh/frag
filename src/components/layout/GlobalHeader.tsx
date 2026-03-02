import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/features/search/SearchBar';
import AuthStatus from './AuthStatus';
import MobileMenu from './MobileMenu';
import { Search } from 'lucide-react';

export default function GlobalHeader() {
  return (
    <header className="sticky top-0 z-[999] w-full border-b border-stone-200 bg-white/95 backdrop-blur-md transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="relative w-8 h-8 md:w-9 md:h-9">
              <Image
                src="/logo.svg"
                alt="Scentia Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-serif text-2xl font-light tracking-tight text-stone-900">Scentia</span>
          </Link>
        </div>

        {/* Center: Search Bar - Responsive */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-12">
          <SearchBar />
        </div>

        {/* Right: Navigation & Auth */}
        <div className="flex items-center gap-6 md:gap-10">
          <nav className="hidden xl:flex items-center gap-8">
            <Link href="/profile" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors">
              My Shelf
            </Link>
            <Link href="/layering" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors">
              Layering
            </Link>
            <Link href="/quiz" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900 transition-colors">
              Finder
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/search" className="lg:hidden p-2 text-stone-500 hover:text-stone-900 transition-colors">
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </Link>
            <AuthStatus />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
