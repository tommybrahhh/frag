'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getPerfumeImage } from '@/lib/perfume-utils';

interface RandomPerfumeType {
  slug: string;
  image_url?: string;
  name: string;
  brand?: { name: string }[]; // Changed to array
  rating?: number;
}

interface RandomPerfumeClientProps {
  randomPerfume: RandomPerfumeType | null;
}

export default function RandomPerfumeClient({ randomPerfume }: RandomPerfumeClientProps) {
  if (!randomPerfume) return null;

  return (
    <div className="relative z-10 w-full md:w-72">
      <div className="absolute -top-3 -left-3 z-20 bg-amber-400 text-stone-900 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg -rotate-12">
        Lucky Pick
      </div>
      <Link href={`/perfume/${randomPerfume.slug}`} className="block group bg-stone-50 border border-stone-100 p-6 rounded-[2rem] hover:bg-white hover:border-stone-200 hover:shadow-xl transition-all duration-500">
        <div className="aspect-square relative mb-4 bg-white rounded-2xl p-6 overflow-hidden">
          {randomPerfume.image_url ? (
            <Image 
              src={getPerfumeImage(randomPerfume.image_url)} 
              alt={randomPerfume.name} 
              fill
              className="object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full bg-stone-50 flex items-center justify-center text-[10px] text-stone-300 font-bold uppercase tracking-widest">No Image</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 truncate">
            {randomPerfume.brand?.[0]?.name}
          </div>
          <h4 className="font-serif text-lg text-stone-900 truncate mb-2">{randomPerfume.name}</h4>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-amber-400 text-[12px]">★</span>
            <span className="text-[11px] font-bold text-stone-600 pt-0.5">{randomPerfume.rating?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
