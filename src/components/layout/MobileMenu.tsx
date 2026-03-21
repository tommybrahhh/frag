'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Portal from '@/components/ui/Portal';
import { X, ChevronRight, LogOut, User, Sparkles, Layers, Search, BarChart2, Menu, BookOpen } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navItems = [
    { label: 'My Shelf', href: '/profile', icon: User },
    { label: 'Layering', href: '/layering', icon: Layers },
    { label: 'Compare', href: '/compare', icon: BarChart2 },
    { label: 'Finder', href: '/quiz', icon: Sparkles },
    { label: 'Blog', href: '/blog', icon: BookOpen },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Community', href: '/community', icon: Menu },
  ];

  return (
    <div className="lg:hidden">
      {/* TRIGGER BUTTON - Always remains in the header */}
      <button
        onClick={toggleMenu}
        className="relative z-[10] p-2 -mr-2 text-stone-900 focus:outline-none"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* RENDER MENU IN PORTAL (Top-level of Body) */}
      <Portal>
        {/* OVERLAY */}
        <div 
          className={`fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={closeMenu}
        />

        {/* MENU PANEL */}
        <div 
          className={`
            fixed top-0 right-0 bottom-0 z-[10001] w-[85%] max-w-[320px] bg-white shadow-2xl
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            flex flex-col h-[100dvh]
          `}
        >
          <div className="flex flex-col h-full w-full overflow-hidden bg-white">
            {/* 1. Header Section */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between shrink-0">
              <Link href="/" onClick={closeMenu} className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <Image src="/logo.svg" alt="Scentia" fill className="object-contain" />
                </div>
                <span className="font-serif text-2xl text-stone-900">Scentia</span>
              </Link>
              <button onClick={closeMenu} className="text-stone-400 p-1">
                <X size={20} />
              </button>
            </div>

            {/* 2. Scrollable Body Section */}
            <div className="flex-1 overflow-y-auto p-6 bg-white hide-scrollbar">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.label}
                    href={item.href} 
                    className="flex items-center justify-between p-4 rounded-xl bg-stone-50 text-stone-900 hover:bg-stone-100 transition-colors active:bg-stone-200"
                    onClick={closeMenu}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-stone-400" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-300" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* 3. Footer Section */}
            <div className="p-6 border-t border-stone-100 bg-stone-50 shrink-0">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-900 overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                          <span>{user.email?.[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold truncate text-stone-900">{user.email}</p>
                      <Link href="/profile" onClick={closeMenu} className="text-[10px] text-stone-500 uppercase tracking-widest font-bold hover:text-stone-900">My Shelf</Link>
                    </div>
                  </div>
                  <button
                    onClick={() => { signOut(); closeMenu(); }}
                    className="w-full py-3 bg-white border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block w-full bg-stone-900 text-white p-4 rounded-xl text-center font-bold text-xs tracking-widest uppercase hover:bg-stone-800 transition shadow-lg active:scale-[0.98]"
                  onClick={closeMenu}
                >
                  Sign In to Scentia
                </Link>
              )}
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
