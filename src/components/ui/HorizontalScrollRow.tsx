'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Perfume {
  id: string;
  name: string;
  brand: { name: string };
  image_url: string;
}

const HorizontalScrollRow = ({ items }: { items: Perfume[] }) => {
  return (
    <div
      className="w-full overflow-x-auto pb-12 mb-16 scrollbar-hide"
      role="region"
      aria-label="Perfume carousel"
      tabIndex={0}
    >
      <div className="flex gap-4 justify-center">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/perfume/${p.id}`}
            className="min-w-[135px] w-[135px] sm:min-w-[165px] sm:w-[165px] group flex-shrink-0"
          >
            <div className="bg-white rounded-2xl h-45 sm:h-54 flex items-center justify-center p-4 sm:p-6 border border-stone-100 group-hover:border-stone-300 transition-all duration-500 relative mb-4">
               {p.image_url ? (
                 <Image
                   src={p.image_url}
                   alt={`${p.name} by ${p.brand?.name}`}
                   className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-700"
                   width={220}
                   height={288}
                   quality={85}
                 />
               ) : (
                 <span className="text-xs text-stone-300">No Image</span>
               )}
            </div>
            <div className="px-2">
               <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase truncate mb-2">
                 {p.brand?.name}
               </div>
               <div className="font-serif text-xl text-stone-900 leading-tight group-hover:text-stone-600 transition truncate">
                 {p.name}
               </div>
            </div>
          </Link>
        ))}
        <div className="min-w-[100px] flex items-center justify-center">
          <Link
            href="/search"
            className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-900 hover:border-stone-900 hover:text-white transition"
            aria-label="Explore more scents"
          >
            →
          </Link>
       </div>
      </div>
    </div>
  );
};

export default HorizontalScrollRow;