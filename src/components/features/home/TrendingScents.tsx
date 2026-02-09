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
    <section className="py-24 bg-stone-50 border-y border-stone-200 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-end justify-between mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-[1px] bg-stone-300" />
               <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">
                 The Hot List
               </span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-stone-900 leading-none">
              Community <span className="italic text-stone-400">Favorites</span>
            </h2>
          </div>
          <Link href="/search?sort=popular" className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group">
            <span>Full Charts</span>
            <div className="w-4 h-[1px] bg-stone-300 group-hover:w-8 transition-all group-hover:bg-stone-900" />
          </Link>
        </div>

        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {perfumes.map((perfume, index) => (
              <motion.div 
                key={perfume.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.8 }}
                viewport={{ once: true }}
                className="snap-start shrink-0 w-[280px] md:w-[340px]"
              >
                <Link href={`/perfume/${perfume.slug || perfume.id}`} className="group block">
                  <div className="relative aspect-[4/5] bg-stone-50 rounded-3xl overflow-hidden border border-stone-100 mb-6 transition-all duration-700 group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] group-hover:-translate-y-2">
                    
                    {/* Large Rank Watermark */}
                    <div className="absolute top-6 left-6 z-10 font-serif text-6xl text-stone-200 group-hover:text-stone-300 transition-colors select-none italic pointer-events-none">
                      {index + 1}
                    </div>

                    {perfume.image_url ? (
                      <Image
                        src={perfume.image_url}
                        alt={perfume.name}
                        fill
                        className="object-contain p-10 mix-blend-multiply transition-transform duration-1000 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 340px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300 font-bold uppercase tracking-widest text-[10px]">
                        No Image
                      </div>
                    )}
                    
                    {/* Quick Info Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-stone-50/80 to-transparent translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                       <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full shadow-sm">
                          View Details
                       </span>
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 truncate">
                      {perfume.brand?.name || 'Unknown Brand'}
                    </div>
                    <h3 className="font-serif text-2xl text-stone-900 leading-tight mb-2 group-hover:text-stone-600 transition-colors truncate">
                      {perfume.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                       {perfume.rating && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-300 text-xs">★</span>
                            <span className="text-[10px] font-bold text-stone-500 pt-0.5 tracking-tighter">{perfume.rating.toFixed(1)}</span>
                          </div>
                       )}
                       <div className="w-12 h-[1px] bg-stone-200 group-hover:w-full group-hover:bg-stone-900 transition-all duration-700" />
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
