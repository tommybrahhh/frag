'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import PerfumeImage from '@/components/ui/PerfumeImage';

export default function ActiveDiscussions({ discussions }: { discussions: any[] }) {
  if (!discussions || discussions.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-stone-100 rounded-2xl">
        <p className="text-stone-400 text-[9px] font-bold uppercase tracking-[0.3em]">Quiet Atmospheres</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {discussions.map((item, index) => {
        const p = item.perfume;
        if (!p) return null;

        return (
          <Link 
            key={`${p.slug}-${index}`}
            href={`/perfume/${p.slug}`}
            className="flex items-center gap-4 p-2.5 -mx-2.5 rounded-[20px] hover:bg-stone-50 transition-all duration-500 group"
          >
             <div className="w-12 h-12 bg-[#FDFDFB] rounded-xl flex-shrink-0 p-2.5 border border-stone-50 shadow-sm group-hover:shadow-md transition-all duration-700">
                <PerfumeImage 
                  src={p.image_url} 
                  alt={p.name} 
                  width={48} 
                  height={48} 
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                />
             </div>
             
             <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 mb-0.5 truncate">{p.brands?.name}</div>
                <div className="font-serif text-base text-stone-900 truncate group-hover:text-amber-900 transition-colors">{p.name}</div>
             </div>

             <div className="flex items-center gap-1 text-stone-300 group-hover:text-amber-500 transition-colors min-w-[24px]">
                <MessageSquare className="w-3 h-3 fill-current opacity-20 group-hover:opacity-100" />
                <span className="text-[10px] font-bold text-stone-400 group-hover:text-stone-900">{item.count}</span>
             </div>
          </Link>
        );
      })}
    </div>
  );
}