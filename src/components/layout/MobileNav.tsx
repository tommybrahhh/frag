'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Sparkles, User, MessageCircle } from 'lucide-react';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export default function MobileNav() {
  const pathname = usePathname();
  const { scrollDirection, isAtTop } = useScrollDirection();
  
  // Only hide when scrolling down and not at the very top
  const isHidden = scrollDirection === 'down' && !isAtTop;

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Search', icon: Search, href: '/search' },
    { label: 'Community', icon: MessageCircle, href: '/community' },
    { label: 'Finder', icon: Sparkles, href: '/quiz' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  return (
    <nav 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md lg:hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
        isHidden ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="bg-white/80 backdrop-blur-xl border border-stone-200/60 rounded-2xl px-2 h-14 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-16 h-12 transition-all duration-300 ${
                isActive ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-1 h-1 bg-stone-900 rounded-full animate-in fade-in zoom-in duration-300" />
              )}
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.6px]'}`} />
              <span className={`text-[8px] font-bold uppercase tracking-[0.1em] ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
