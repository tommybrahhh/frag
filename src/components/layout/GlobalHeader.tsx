import Link from 'next/link';
import Image from 'next/image';
import MobileMenu from './MobileMenu';
import SearchBar from '@/components/features/search/SearchBar';
import AuthStatus from './AuthStatus';

export default function GlobalHeader() {
  return (
    <header className="sticky top-0 z-[999] w-full border-b border-stone-100 bg-white transition-all duration-300">
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
              My Shelf
            </Link>
            <Link href="/layering" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Layering
            </Link>
            <Link href="/search" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Search
            </Link>
            <Link href="/compare" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Versus
            </Link>
            <Link href="/quiz" className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 transition-colors">
              Finder
            </Link>
          </nav>
        </div>

        {/* Center: Search Bar - Expanded width */}
        <div className="hidden lg:block flex-1 w-[75%] mx-4">
          <SearchBar />
        </div>

        {/* Right: Auth & Mobile Menu */}
        <div className="flex items-center gap-6 md:gap-8">
          {/* Auth Actions for Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <AuthStatus />
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
