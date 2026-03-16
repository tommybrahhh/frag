'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SearchBar from '@/components/features/search/SearchBar';
import AuthStatus from './AuthStatus';
import MobileMenu from './MobileMenu';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export default function GlobalHeader() {
  const pathname = usePathname();
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Header visibility logic: visible at top, or when scrolling up
  const isVisible = isAtTop || scrollDirection === 'up';

  const navLinks = [
    { name: 'My Shelf', href: '/profile' },
    { name: 'Layering', href: '/layering' },
    { name: 'Finder', href: '/quiz' },
  ];

  useEffect(() => {
    const updateProgress = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const currentProgress = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(currentProgress);
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-[999] w-full border-b transition-all duration-500 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        ${isAtTop 
          ? 'bg-white/80 border-transparent py-2' 
          : 'bg-white/90 backdrop-blur-xl border-stone-200/60 shadow-sm py-0'
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between transition-all duration-300">
        
        {/* Left: Logo */}
        <div className={`flex items-center transition-all duration-500 ${isSearchFocused ? 'opacity-0 -translate-x-4 pointer-events-none lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto' : 'opacity-100 translate-x-0'}`}>
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="relative w-8 h-8 md:w-9 md:h-9 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]">
              <Image
                src="/logo.svg"
                alt="Scentia Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className={`font-serif text-2xl font-light transition-all duration-500 text-stone-900 ${isAtTop ? 'tracking-widest' : 'tracking-tight'}`}>
              Scentia
            </span>
          </Link>
        </div>

        {/* Center: Search Bar - Responsive */}
        <div className={`flex-1 transition-all duration-500 ease-in-out ${isSearchFocused ? 'max-w-2xl mx-4 lg:mx-12' : 'max-w-xl mx-8 lg:mx-12'} hidden lg:flex`}>
          <SearchBar onFocusChange={setIsSearchFocused} />
        </div>

        {/* Right: Navigation & Auth */}
        <div className={`flex items-center gap-6 md:gap-10 transition-all duration-500 ${isSearchFocused ? 'opacity-0 translate-x-4 pointer-events-none lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto' : 'opacity-100 translate-x-0'}`}>
          <nav className="hidden xl:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 relative group
                    ${isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 h-px bg-stone-900 transition-all duration-300 
                    ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:block hover:drop-shadow-[0_0_10px_rgba(0,0,0,0.05)] transition-all duration-300">
              <AuthStatus />
            </div>
            <MobileMenu />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="absolute bottom-[-1px] left-0 h-[2px] bg-stone-900/20 transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </header>
  );
}
