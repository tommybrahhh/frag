'use client';

import React from 'react';
import Link from 'next/link';

interface LayeringHeaderProps {
  hasResult: boolean;
  onSave: () => void;
}

export default function LayeringHeader({ hasResult, onSave }: LayeringHeaderProps) {
  return (
    <>
      <div className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Layering Studio</span>
        <div className="w-8"></div>
      </div>

      <div className="bg-stone-50 px-8 py-6 border-b border-stone-100 flex justify-between items-center rounded-t-[32px]">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Create Your Blend</h1>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Select two fragrances to combine</p>
        </div>
        {hasResult && (
          <button 
            onClick={onSave}
            className="px-6 py-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-stone-700 transition shadow-lg"
          >
            Save Recipe
          </button>
        )}
      </div>
    </>
  );
}
