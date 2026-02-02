'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/features/search/SearchBar';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden flex items-center">
      {/* Hamburger Icon */}
      <button
        onClick={toggleMenu}
        className="p-2 text-stone-600 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 rounded-md"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="flex-shrink-0 flex items-center gap-3 group" onClick={closeMenu}>
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
            <button
              onClick={closeMenu}
              className="p-2 text-stone-600 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 rounded-md"
              aria-label="Close mobile menu"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <SearchBar onSearch={closeMenu} />
          </div>

          <nav className="flex flex-col gap-4 mb-8">
            <Link href="/profile" className="text-lg font-semibold text-stone-700 hover:text-stone-900 transition-colors" onClick={closeMenu}>
              My Shelf
            </Link>
            <Link href="/layering" className="text-lg font-semibold text-stone-700 hover:text-stone-900 transition-colors" onClick={closeMenu}>
              Layering
            </Link>
            <Link href="/search" className="text-lg font-semibold text-stone-700 hover:text-stone-900 transition-colors" onClick={closeMenu}>
              Search
            </Link>
            <Link href="/compare" className="text-lg font-semibold text-stone-700 hover:text-stone-900 transition-colors" onClick={closeMenu}>
              Compare
            </Link>
            <Link href="/quiz" className="text-lg font-semibold text-stone-700 hover:text-stone-900 transition-colors" onClick={closeMenu}>
              Finder
            </Link>
          </nav>

          {/* Auth Actions for Mobile */}
          <div className="mt-auto">
            {loading ? (
                <div className="w-full h-10 bg-stone-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex flex-col gap-4">
                {/* Example: User's name or profile link */}
                <Link href="/profile" className="bg-stone-100 text-stone-900 px-5 py-3 rounded-full text-base font-bold text-center hover:bg-stone-200 transition" onClick={closeMenu}>
                  Hello, {user.email?.split('@')[0]}!
                </Link>
                <button
                  onClick={() => { signOut(); closeMenu(); }}
                  className="bg-red-600 text-white px-5 py-3 rounded-full text-base font-bold text-center hover:bg-red-700 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-stone-900 text-white px-5 py-3 rounded-full text-base font-bold text-center hover:bg-stone-800 transition shadow-sm"
                onClick={closeMenu}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}