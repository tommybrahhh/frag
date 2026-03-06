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
    <div className="flex flex-col border-t border-stone-100">
      {discussions.map((item, index) => {
        const p = item.perfume;
        if (!p) return null;

        return (
          <Link 
            key={`${p.slug}-${index}`}
            href={`/perfume/${p.slug}`}
            className="flex items-center gap-4 py-4 px-2 -mx-2 border-b border-stone-100/60 last:border-0 hover:bg-stone-50 transition-colors group rounded-xl"
          >
             <div className="w-14 h-14 bg-stone-50 rounded-2xl flex-shrink-0 p-1.5 border border-stone-100 shadow-sm overflow-hidden">
                <PerfumeImage 
                  src={p.image_url} 
                  alt={p.name} 
                  width={44} 
                  height={44} 
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" 
                />
             </div>
             
             <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1 truncate">{p.brands?.name}</div>
                <div className="font-serif text-[15px] text-stone-900 leading-tight truncate tracking-tight">{p.name}</div>
             </div>

             <div className="flex flex-col items-center justify-center min-w-[32px] gap-1.5 pr-1">
                <MessageSquare className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
                <span className="font-serif text-[11px] font-bold text-stone-400 group-hover:text-stone-700 transition-colors">{item.count}</span>
             </div>
          </Link>
        );
      })}
    </div>
  );
}