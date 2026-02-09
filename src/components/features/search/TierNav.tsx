'use client';

import { motion } from 'framer-motion';
import { Gem, Crown, Sparkles } from 'lucide-react';

interface TierNavProps {
  onSelectTier: (tier: string) => void;
  activeTier?: string;
}

const TIERS = [
  {
    id: 'Designer',
    label: 'Designer',
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
    <div className="max-w-[1400px] mx-auto px-6 mb-16">
      <div className="flex items-center justify-center mb-8">
        <h3 className="font-serif text-3xl text-stone-900">Browse by Category</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isActive = activeTier === tier.id;

          return (
            <button
              key={tier.id}
              onClick={() => onSelectTier(tier.id)}
              className={`
                relative overflow-hidden group text-left p-8 rounded-3xl border transition-all duration-500
                ${isActive 
                  ? `ring-2 ring-stone-900 bg-stone-50 border-stone-900` 
                  : 'bg-white border-stone-100 hover:border-stone-300 hover:shadow-xl hover:-translate-y-1'
                }
              `}
            >
              {/* Subtle background for active/hover */}
              <div className={`absolute inset-0 bg-stone-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 flex flex-col h-full">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300
                  ${isActive ? 'bg-stone-900 text-white' : 'bg-stone-50 group-hover:bg-white group-hover:shadow-sm text-stone-600'}
                `}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} />
                </div>

                <h4 className={`font-serif text-2xl mb-2 text-stone-900`}>
                  {tier.label}
                </h4>
                
                <p className="text-sm text-stone-500 font-medium leading-relaxed group-hover:text-stone-700">
                  {tier.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}