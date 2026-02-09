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
    <section className="py-20 bg-stone-50 border-y border-stone-200">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2 block">
              Trending Now
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-stone-900">
              Community Favorites
            </h2>
          </div>
          <Link href="/search?sort=popular" className="hidden md:block text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 underline underline-offset-4">
            View All Charts
          </Link>
        </div>

        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {perfumes.map((perfume, index) => (
              <motion.div 
                key={perfume.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="snap-start shrink-0 w-[280px] md:w-[320px]"
              >
                <Link href={`/perfume/${perfume.slug || perfume.id}`} className="group block h-full">
                  <div className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 mb-4 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                    {/* Rank Badge */}
                    <div className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-stone-900 text-white font-serif text-lg rounded-full shadow-lg">
                      {index + 1}
                    </div>

                    {perfume.image_url ? (
                      <Image
                        src={perfume.image_url}
                        alt={perfume.name}
                        fill
                        className="object-contain p-6 mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300 font-bold uppercase tracking-widest text-xs">
                        No Image
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  <div className="px-2">
                    <div className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1 truncate">
                      {perfume.brand?.name || 'Unknown Brand'}
                    </div>
                    <h3 className="font-serif text-xl text-stone-900 leading-tight group-hover:text-stone-600 transition-colors">
                      {perfume.name}
                    </h3>
                    {perfume.rating && (
                       <div className="mt-2 flex items-center gap-1">
                         <span className="text-yellow-500 text-sm">★</span>
                         <span className="text-xs font-bold text-stone-600 pt-0.5">{perfume.rating.toFixed(1)}</span>
                       </div>
                    )}
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
