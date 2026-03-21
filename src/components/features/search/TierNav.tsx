'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface TierNavProps {
  onSelectTier?: (tier: string) => void;
  activeTier?: string;
}

const TIERS = [
  {
    id: 'Designer',
    label: 'Designer',
    slug: 'designer',
    initial: 'D',
    description: 'The iconic houses and legendary names you know and love.',
    border: 'border-stone-200',
  },
  {
    id: 'Niche',
    label: 'Niche',
    slug: 'niche',
    initial: 'N',
    description: 'Artisanal, rare compositions for those who seek the extraordinary.',
    border: 'border-stone-200',
  },
  {
    id: 'Indie',
    label: 'Indie',
    slug: 'indie',
    initial: 'I',
    description: 'Bold, experimental, and small-batch olfactory art.',
    border: 'border-stone-200',
  }
];

export default function TierNav({ onSelectTier, activeTier }: TierNavProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="relative group/scroll">
        <div className="flex overflow-x-auto pb-8 gap-6 md:grid md:grid-cols-3 md:gap-10 hide-scrollbar -mx-6 px-6">
          {TIERS.map((tier) => {
            const isActive = activeTier === tier.id;

            const content = (
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Monogram "Icon" */}
                <div className={`
                  w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-6 md:mb-8 transition-all duration-700 relative
                  ${isActive ? 'bg-stone-900 shadow-xl' : 'bg-white border border-stone-100 group-hover:border-stone-200 shadow-sm'}
                `}>
                  <span className={`
                    font-serif text-3xl md:text-5xl transition-all duration-500
                    ${isActive ? 'text-white' : 'text-stone-300 group-hover:text-stone-900'}
                  `}>
                    {tier.initial}
                  </span>
                  
                  {/* Decorative inner ring for active state */}
                  {isActive && (
                    <motion.div 
                      layoutId={`ring-${tier.id}`}
                      className="absolute inset-1 border border-white/20 rounded-full"
                    />
                  )}
                </div>

                <h4 className="font-serif text-xl md:text-3xl mb-3 md:mb-4 text-stone-900 tracking-tight">
                  {tier.label}
                </h4>
                
                <p className="text-[11px] md:text-sm text-stone-500 font-light leading-relaxed px-2 md:px-8 max-w-[280px]">
                  {tier.description}
                </p>

                <div className={`
                  mt-6 h-px w-8 transition-all duration-500
                  ${isActive ? 'w-16 bg-stone-900' : 'bg-stone-200 group-hover:bg-stone-400'}
                `} />
              </div>
            );

            const className = `
              relative overflow-hidden group p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] border transition-all duration-700 shrink-0 w-[280px] md:w-auto bg-white
              ${isActive 
                ? 'border-stone-900 shadow-2xl' 
                : 'border-stone-50 hover:border-stone-200 hover:shadow-xl'
              }
            `;

            if (onSelectTier) {
              return (
                <button key={tier.id} onClick={() => onSelectTier(tier.id)} className={className}>
                  {content}
                </button>
              );
            }

            return (
              <Link key={tier.id} href={`/tiers/${tier.slug}`} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
