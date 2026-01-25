import Link from 'next/link';
import { Perfume } from '@/types';

interface FragranceCardProps {
  perfume: Perfume;
}

export default function FragranceCard({ perfume }: FragranceCardProps) {
  // Proactive Fix: Handle case where brand is an object to prevent React crash
  const brandName = typeof perfume.brand === 'object' ? (perfume.brand as any).name : perfume.brand;

  return (
    <div className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <Link href={`/perfume/${perfume.slug || perfume.id}`}>
        <div className="h-48 flex items-center justify-center p-4 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors">
          {perfume.image_url ? (
            <img 
              src={perfume.image_url} 
              alt={perfume.name} 
              className="h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" 
            />
          ) : (
            <span className="text-stone-300 text-xs italic">No Image</span>
          )}
        </div>
        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
            {brandName}
          </div>
          <div className="font-serif text-lg text-stone-900 leading-tight truncate">
            {perfume.name}
          </div>
        </div>
      </Link>
    </div>
  );
}
