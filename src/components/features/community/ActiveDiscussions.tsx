'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import PerfumeImage from '@/components/ui/PerfumeImage';

export default function ActiveDiscussions({ discussions }: { discussions: any[] }) {
  if (!discussions || discussions.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-stone-200 rounded-2xl">
        <p className="text-stone-400 text-[9px] font-bold uppercase tracking-[0.3em]">Quiet Atmospheres</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {discussions.map((item, index) => {
        const p = item.perfume;
        if (!p) return null;

        return (
          <Link 
            key={`${p.slug}-${index}`}
            href={`/perfume/${p.slug}`}
            className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors -mx-2 px-2 rounded-lg group"
          >
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-shrink-0 bg-stone-50 rounded p-1 border border-stone-100">
                    <PerfumeImage 
                      src={p.image_url} 
                      alt={p.name} 
                      width={24} 
                      height={24} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" 
                    />
                </div>
                <div className="flex flex-col gap-0">
                    <span className="text-[13px] text-stone-800 tracking-tight leading-tight">
                       {p.name}
                    </span>
                    <span className="text-[9px] text-stone-400 uppercase tracking-widest leading-tight">
                       {p.brands?.name}
                    </span>
                </div>
             </div>

             <div className="flex items-baseline gap-1.5 pl-2">
                <span className="font-serif text-[13px] text-stone-900">
                   {item.count}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest flex items-center gap-1">
                   Comments
                </span>
             </div>
          </Link>
        );
      })}
    </div>
  );
}
