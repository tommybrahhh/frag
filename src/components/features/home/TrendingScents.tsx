'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion } from 'framer-motion';

interface TrendingPerfume {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  rating?: number;
  brand: { name: string } | null;
}

interface TrendingScentsProps {
  perfumes: TrendingPerfume[];
}

export default function TrendingScents({ perfumes }: TrendingScentsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!perfumes || perfumes.length === 0) return null;

  return (
    <section className="py-12 md:py-24 bg-stone-50 border-y border-stone-200 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-end justify-between mb-8 md:mb-16">
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
               <div className="w-4 h-[1px] bg-stone-300" />
               <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">
                 The Hot List
               </span>
            </div>
            <h2 className="font-serif text-2xl md:text-5xl text-stone-900 leading-none">
              Community <span className="italic text-stone-400">Favorites</span>
            </h2>
          </div>
          <Link href="/search?sort=popular" className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
            View All →
          </Link>
        </div>

        <div className="relative -mx-6 px-6">
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-8 overflow-x-auto pb-6 md:pb-12 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {perfumes.map((perfume, index) => (
              <motion.div 
                key={perfume.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.8 }}
                viewport={{ once: true }}
                className="snap-start shrink-0 w-[180px] md:w-[340px]"
              >
                <Link href={`/perfume/${perfume.slug || perfume.id}`} className="group block">
                  <div className="relative aspect-square bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-stone-100 mb-3 md:mb-6 transition-all duration-700 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]">
                    
                    {perfume.image_url ? (
                      <Image
                        src={perfume.image_url}
                        alt={perfume.name}
                        fill
                        className="object-contain p-6 md:p-10 mix-blend-multiply transition-transform duration-1000 group-hover:scale-105"
                        sizes="(max-width: 768px) 180px, 340px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300 font-bold uppercase tracking-widest text-[10px]">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="px-1 text-center md:text-left">
                    <div className="text-[7px] md:text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1 truncate">
                      {perfume.brand?.name || 'Unknown Brand'}
                    </div>
                    <h3 className="font-serif text-sm md:text-2xl text-stone-900 leading-tight mb-1 group-hover:text-stone-600 transition-colors truncate">
                      {perfume.name}
                    </h3>
                    
                    <div className="flex items-center justify-center md:justify-between">
                       {perfume.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 text-[10px]">★</span>
                            <span className="text-[8px] md:text-[10px] font-bold text-stone-500 pt-0.5 tracking-tighter">{perfume.rating.toFixed(1)}</span>
                          </div>
                       )}
                       <div className="hidden md:block w-12 h-[1px] bg-stone-200 group-hover:w-full group-hover:bg-stone-900 transition-all duration-700" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
