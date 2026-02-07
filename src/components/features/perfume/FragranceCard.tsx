import Link from 'next/link';
import Image from 'next/image';
import { Perfume } from '@/types';

interface FragranceCardProps {
  perfume: Perfume;
}

export default function FragranceCard({ perfume }: FragranceCardProps) {
  // Proactive Fix: Handle case where brand is an object to prevent React crash
  const brandName = typeof perfume.brand === 'object' ? (perfume.brand as any).name : perfume.brand;

  return (
    <div className="group rounded-xl p-4 transition-all duration-300 hover:bg-stone-100 hover:shadow-lg hover:-translate-y-1">
      <Link href={`/perfume/${perfume.slug || perfume.id}`}>
        <div className="h-48 flex items-center justify-center p-4 mb-4 rounded-lg transition-colors relative">
          {perfume.image_url ? (
            <Image 
              src={perfume.image_url} 
              alt={perfume.name} 
              fill
              className="object-contain mix-blend-multiply" 
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
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

