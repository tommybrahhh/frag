'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import PerfumeImage from '@/components/ui/PerfumeImage';

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
    <section className="py-12 md:py-24 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
               <div className="w-8 h-px bg-stone-200" />
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-stone-500">
                 Trending Now
               </span>
            </div>
            <h2 className="font-serif text-3xl md:text-6xl text-stone-900 leading-[1.1]">
              Trending <span className="italic text-stone-400">Scents</span>
            </h2>
          </div>
          <Link 
            href="/search?sort=popular" 
            className="group inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-stone-900"
          >
            <span>View All Library</span>
            <span className="w-8 h-px bg-stone-900 transform transition-transform duration-300 group-hover:scale-x-125 origin-left" />
          </Link>
        </div>

        <div className="relative -mx-6 px-6 group/scroll">
          {/* Fade Out Edges for Scroll indication */}
          <div className="absolute left-6 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-6 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div 
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-8 overflow-x-auto pb-6 md:pb-12 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {perfumes.map((perfume, index) => (
              <motion.div 
                key={perfume.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="snap-start shrink-0 w-[160px] md:w-[260px]"
              >
                <Link href={`/perfume/${perfume.slug || perfume.id}`} className="group block h-full">
                  <div className="relative aspect-square bg-stone-50 rounded-3xl overflow-hidden mb-6 transition-all duration-700 group-hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)]">
                    {perfume.image_url ? (
                      <div className="w-full h-full p-8 md:p-12 relative">
                        <PerfumeImage
                          src={perfume.image_url}
                          alt={perfume.name}
                          fill
                          className="object-contain mix-blend-multiply transition-transform duration-1000 group-hover:scale-110"
                          sizes="(max-width: 768px) 160px, 260px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300 font-bold uppercase tracking-widest text-[10px]">
                        No Image
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 transition-colors duration-700" />
                  </div>

                  <div className="px-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                        {perfume.brand?.name || 'Unknown Brand'}
                      </span>
                    </div>
                    
                    <h3 className="font-serif text-lg md:text-xl text-stone-900 leading-tight mb-3 group-hover:text-stone-600 transition-colors line-clamp-1">
                      {perfume.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                       {perfume.rating ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-0.5">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-[10px] md:text-[12px] ${i < Math.floor(perfume.rating || 0) ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
                              ))}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-stone-500 pt-0.5 tracking-tighter">
                              {perfume.rating.toFixed(1)}
                            </span>
                          </div>
                       ) : (
                          <div className="h-4" />
                       )}
                       <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                         Details
                       </span>
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
