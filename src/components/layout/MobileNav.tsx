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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-stone-100 lg:hidden px-4 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                isActive ? 'text-stone-900 scale-105' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-stone-50' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
