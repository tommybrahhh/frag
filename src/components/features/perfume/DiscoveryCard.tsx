'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Recommendation } from '@/lib/recommendation-engine';
import { getPerfumeImage } from '@/lib/perfume-utils';

interface DiscoveryCardProps {
  recommendation: Recommendation;
}

export default function DiscoveryCard({ recommendation }: DiscoveryCardProps) {
  const router = useRouter();
  const { perfume, reason, score } = recommendation;

  if (!perfume) return null;

  return (
    <div 
      className="bg-stone-100 text-stone-800 rounded-2xl p-8 md:p-12 w-full grid md:grid-cols-2 gap-8 items-center cursor-pointer hover:bg-stone-200/60 transition-colors col-span-1 sm:col-span-2 lg:col-span-3"
      onClick={() => router.push(`/perfume/${perfume.slug || perfume.id}`)}
    >
      {/* Left Side: The "Why" */}
      <div className="md:pr-8">
        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">A New Direction</p>
        <p 
          className="font-serif text-2xl md:text-3xl leading-snug text-stone-800"
        >
          {reason}
        </p>
      </div>

      {/* Right Side: The "What" */}
      <div className="bg-white/50 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative h-40 w-40 flex-shrink-0 flex items-center justify-center">
          {perfume.image_url ? (
            <img src={getPerfumeImage(perfume.image_url)} alt={perfume.name} className="h-full w-full object-contain mix-blend-multiply" />
          ) : (
             <span className="text-stone-300 text-xs italic">No Image</span>
          )}
        </div>
        <div className="text-center sm:text-left">
          <div className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-2">{perfume.brand?.name}</div>
          <h4 className="font-serif text-xl text-stone-900 transition">{perfume.name}</h4>
          {score > 0 && (
            <div className="mt-4 inline-block bg-stone-200 px-3 py-1 rounded-full">
              <span className="text-xs font-bold text-stone-800">{Math.round(score)}% Match</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
