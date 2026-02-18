'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { getPerfumeImage } from '@/lib/perfume-utils';

export default function ActiveDiscussions({ discussions }: { discussions: any[] }) {
  if (!discussions || discussions.length === 0) {
    return <div className="text-stone-400 text-sm italic">No active discussions.</div>;
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
            className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-stone-50 transition-colors group"
          >
             <div className="w-12 h-12 bg-stone-100 rounded-lg flex-shrink-0 p-1 border border-stone-200">
                {p.image_url ? (
                   <Image src={getPerfumeImage(p.image_url)} alt={p.name} width={48} height={48} className="w-full h-full object-contain mix-blend-multiply" />
                ) : (
                   <div className="w-full h-full bg-stone-200 rounded" />
                )}
             </div>
             
             <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate">{p.brands?.name}</div>
                <div className="font-serif text-stone-900 truncate group-hover:text-stone-600 transition-colors">{p.name}</div>
             </div>

             <div className="flex items-center gap-1 text-stone-400 text-xs font-bold">
                <MessageSquare className="w-3 h-3" />
                <span>{item.count}</span>
             </div>
          </Link>
        );
      })}
    </div>
  );
}
