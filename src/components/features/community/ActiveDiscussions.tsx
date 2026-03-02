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
    <div className="space-y-3">
      {discussions.map((item, index) => {
        const p = item.perfume;
        if (!p) return null;

        return (
          <Link 
            key={`${p.slug}-${index}`}
            href={`/perfume/${p.slug}`}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-stone-50 transition-all duration-300 group"
          >
             <div className="w-10 h-10 bg-stone-50 rounded-lg flex-shrink-0 p-1.5 border border-stone-100 shadow-sm transition-all duration-500">
                <PerfumeImage 
                  src={p.image_url} 
                  alt={p.name} 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-contain mix-blend-multiply" 
                />
             </div>
             
             <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5 truncate">{p.brands?.name}</div>
                <div className="font-serif text-[15px] text-stone-900 truncate group-hover:text-stone-600 transition-colors">{p.name}</div>
             </div>

             <div className="flex items-center gap-1.5 text-stone-300 group-hover:text-stone-600 transition-colors min-w-[24px]">
                <MessageSquare className="w-3 h-3" />
                <span className="text-[11px] font-bold text-stone-400 group-hover:text-stone-900">{item.count}</span>
             </div>
          </Link>
        );
      })}
    </div>
  );
}