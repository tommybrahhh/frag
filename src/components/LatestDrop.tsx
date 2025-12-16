'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Perfume {
  id: string;
  name: string;
  brand: { name: string };
  image_url: string;
  rating?: number;
  description?: string;
}

const LatestDrop = ({ perfume }: { perfume: Perfume }) => {
  if (!perfume) return null;

  return (
    <section className="px-6 max-w-[1400px] mx-auto mb-20 md:mb-24">
      <div className="bg-[#F2F0EB] rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[500px] relative">
        <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col justify-center items-start order-2 md:order-1 z-10">
          <div className="flex items-center gap-3 mb-6" role="status" aria-live="polite">
            <span className="w-2 h-2 rounded-full bg-stone-900 animate-pulse" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              New Arrival
            </span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6 leading-[1.1]">
            {perfume.name}
          </h2>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-8">
            by {perfume.brand.name}
          </div>
          <p className="text-stone-600 text-lg font-light leading-relaxed mb-10 max-w-sm">
             A new sensory experience has arrived. Discover the notes that define this season.
          </p>
          <Link 
            href={`/perfume/${perfume.id}`}
            className="group flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
          >
            Explore Scent
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        <div className="w-full md:w-1/2 relative bg-[#EBE9E4] order-1 md:order-2 min-h-[300px] md:min-h-full group cursor-pointer overflow-hidden">
           <Image
             src={perfume.image_url}
             alt={`${perfume.name} by ${perfume.brand.name}`}
             className="absolute inset-0 w-full h-full object-contain p-8 md:p-12 mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
             width={800}
             height={800}
             quality={85}
             priority
           />
           {perfume.rating && (
              <div
                className="absolute top-8 right-8 bg-white/50 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded-full text-xs font-bold text-stone-900 shadow-sm z-20"
                aria-label={`Rating: ${Number(perfume.rating).toFixed(1)} out of 5 stars`}
              >
                 <span aria-hidden="true">★</span> {Number(perfume.rating).toFixed(1)}
              </div>
           )}
        </div>
      </div>
    </section>
  );
};

export default LatestDrop;