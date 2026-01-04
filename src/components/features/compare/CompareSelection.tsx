'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface CompareSelectionProps {
  mainPerfume: any;
  candidates: any[];
}

export default function CompareSelection({ mainPerfume, candidates }: CompareSelectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectOpponent = (opponentId: string) => {
    const idA = searchParams.get('a'); // Or use mainPerfume.id if we trust it
    router.push(`/compare?a=${idA || mainPerfume.id}&b=${opponentId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 mt-12 pb-20">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-stone-900 mb-2">Select Opponent</h1>
          <p className="text-stone-500 text-sm">Comparing against <span className="font-bold">{mainPerfume.name}</span></p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {candidates.map((perfume) => (
            <button
              key={perfume.id}
              onClick={() => selectOpponent(perfume.id)}
              className="group bg-white rounded-2xl p-5 border border-stone-200 hover:border-stone-400 hover:shadow-lg transition-all duration-500 text-left h-full flex flex-col"
            >
              <div className="h-40 mb-4 flex items-center justify-center p-4 bg-stone-50/50 rounded-xl group-hover:bg-stone-50 transition-colors">
                {perfume.image_url ? (
                  <img
                    src={perfume.image_url}
                    className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700"
                    alt={perfume.name}
                  />
                ) : (
                  <span className="text-xs text-stone-300">No Image</span>
                )}
              </div>
              <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase truncate mb-1">{perfume.brand?.name}</div>
              <div className="font-serif text-lg text-stone-900 leading-tight truncate flex-grow">{perfume.name}</div>
            </button>
          ))}
        </div>
      </div>
  );
}