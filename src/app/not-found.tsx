import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | Scentia'
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-[#FDFBF7] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <span className="text-6xl mb-4 block">⚗️</span>
        <h1 className="font-serif text-5xl md:text-6xl text-stone-900 mb-4">Evaporated</h1>
        <p className="text-stone-500 text-lg max-w-md mx-auto">
          The scent you're looking for has dissipated into the air. This page no longer exists or was never bottled.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/" 
          className="px-8 py-3 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition shadow-lg"
        >
          Return to Collection
        </Link>
        <Link 
          href="/search" 
          className="px-8 py-3 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-bold uppercase tracking-widest hover:border-stone-400 transition"
        >
          Find a New Scent
        </Link>
      </div>

      <div className="mt-20 opacity-20 pointer-events-none">
        <span className="text-[10rem] font-serif italic text-stone-300">404</span>
      </div>
    </div>
  );
}
