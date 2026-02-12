'use client';

import { motion } from 'framer-motion';
import { Gem, Crown, Sparkles } from 'lucide-react';
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
    description: 'Iconic scents from world-renowned fashion houses.',
    icon: Crown,
    gradient: 'from-stone-100 to-white',
    border: 'border-stone-100',
    text: 'text-stone-900',
    iconColor: 'text-stone-600'
  },
  {
    id: 'Niche',
    label: 'Niche',
    slug: 'niche',
    description: 'Artistic creations for the connoisseur.',
    icon: Gem,
    gradient: 'from-stone-200 to-white',
    border: 'border-stone-200',
    text: 'text-stone-900',
    iconColor: 'text-stone-600'
  },
  {
    id: 'Indie',
    label: 'Indie',
    slug: 'indie',
    description: 'Handcrafted masterpieces by independent perfumers.',
    icon: Sparkles,
    gradient: 'from-stone-100 to-white',
    border: 'border-stone-100',
    text: 'text-stone-900',
    iconColor: 'text-stone-600'
  }
];

export default function TierNav({ onSelectTier, activeTier }: TierNavProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-3 md:gap-8 hide-scrollbar -mx-6 px-6">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isActive = activeTier === tier.id;

          const content = (
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`
                w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 transition-all duration-500
                ${isActive ? 'bg-stone-900 text-white shadow-lg' : 'bg-white border border-stone-100 group-hover:border-stone-200 text-stone-600'}
              `}>
                <Icon className="w-5 h-5 md:w-7 md:h-7" />
              </div>

              <h4 className="font-serif text-lg md:text-2xl mb-1 md:mb-3 text-stone-900">
                {tier.label}
              </h4>
              
              <p className="text-[9px] md:text-sm text-stone-500 font-light leading-relaxed px-1 md:px-4">
                {tier.description}
              </p>
            </div>
          );

          const className = `
            relative overflow-hidden group p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] border transition-all duration-500 shrink-0 w-[200px] md:w-auto
            ${isActive 
              ? 'bg-white border-stone-900 shadow-xl' 
              : 'bg-white/50 border-stone-50 hover:bg-white hover:border-stone-200'
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
  );
}