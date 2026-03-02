'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Sparkles, User, MessageCircle } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Search', icon: Search, href: '/search' },
    { label: 'Community', icon: MessageCircle, href: '/community' },
    { label: 'Finder', icon: Sparkles, href: '/quiz' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md lg:hidden">
      <div className="bg-white/95 backdrop-blur-md border border-stone-200 rounded-xl px-4 h-16 shadow-lg flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2px]' : 'stroke-[1.5px]'}`} />
              <span className="text-[8px] font-bold uppercase tracking-widest">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
