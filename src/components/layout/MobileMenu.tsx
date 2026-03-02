'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/features/search/SearchBar';
import { Menu, X, ChevronRight, LogOut, User, Sparkles, Layers, Search, BarChart2 } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };

  const navItems = [
    { label: 'My Shelf', href: '/profile', icon: User },
    { label: 'Layering', href: '/layering', icon: Layers },
    { label: 'Compare', href: '/compare', icon: BarChart2 },
    { label: 'Finder', href: '/quiz', icon: Sparkles },
    { label: 'Search', href: '/search', icon: Search },
  ];

  return (
    <div className="lg:hidden flex items-center">
      <button
        onClick={toggleMenu}
        className="p-2 -mr-2 text-stone-600 hover:text-stone-900 transition-colors"
        aria-label="Toggle mobile menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[1001] bg-white animate-in fade-in duration-300">
          <div className="flex flex-col h-full p-6 pt-16">
            <button
              onClick={closeMenu}
              className="absolute top-5 right-6 p-2 text-stone-600 hover:text-stone-900"
              aria-label="Close mobile menu"
            >
              <X className="w-7 h-7" />
            </button>

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-8">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-stone-900">
                  <path d="M62.5 25C52.5 25 45 32.5 45 42.5C45 52.5 52.5 60 62.5 60H37.5C27.5 60 20 67.5 20 77.5C20 87.5 27.5 95 37.5 95" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-serif text-2xl tracking-tight text-stone-900">Scentia</span>
              </div>
              <SearchBar onSearch={closeMenu} />
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link 
                  key={item.label}
                  href={item.href} 
                  className="flex items-center justify-between py-4 border-b border-stone-50 text-base font-medium text-stone-900 hover:text-stone-600 transition-colors"
                  onClick={closeMenu}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className="w-5 h-5 text-stone-400" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </Link>
              ))}
            </nav>

            <div className="mt-auto pb-10">
              {loading ? (
                <div className="w-full h-12 bg-stone-100 rounded-xl animate-pulse" />
              ) : user ? (
                <div className="flex flex-col gap-3">
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 text-stone-900 hover:bg-stone-100 transition"
                    onClick={closeMenu}
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-sm font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold truncate">{user.email}</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">View Profile</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => { signOut(); closeMenu(); }}
                    className="flex items-center justify-center gap-2 w-full p-4 rounded-xl text-stone-500 hover:text-red-600 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block w-full bg-stone-900 text-white p-4 rounded-xl text-center font-bold text-sm tracking-widest uppercase hover:bg-stone-800 transition shadow-lg"
                  onClick={closeMenu}
                >
                  Sign In to Scentia
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}