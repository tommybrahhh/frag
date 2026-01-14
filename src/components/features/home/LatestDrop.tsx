'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Perfume {
  id: string;
  slug: string;
  name: string;
  brand: { name: string };
  image_url: string;
  rating?: number;
  description?: string;
}

const LatestDrop = ({ perfume }: { perfume: Perfume }) => {
  if (!perfume) return null;

  return (
    <div className="h-full bg-[#EBE9E4] rounded-3xl overflow-hidden relative group">
      <Link href={`/perfume/${perfume.slug || perfume.id}`} className="block w-full h-full">
        {/* Full Height Image */}
        <div className="absolute inset-0 w-full h-full p-8 md:p-12">
           <Image
             src={perfume.image_url}
             alt={perfume.name}
             className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
             width={800}
             height={800}
             quality={85}
             priority
           />
        </div>

        {/* Minimal Overlay Name */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-stone-900/10 to-transparent flex items-end justify-center">
          <h2 className="font-serif text-2xl md:text-3xl text-stone-900 text-center leading-tight">
            {perfume.name}
          </h2>
        </div>
      </Link>
    </div>
  );
};

export default LatestDrop;