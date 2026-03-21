'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const VIBE_CATEGORIES = [
  { id: 'all', label: 'All Scents', index: '00' },
  { id: 'fresh', label: 'Fresh', index: '01' },
  { id: 'sweet', label: 'Sweet', index: '02' },
  { id: 'clean', label: 'Clean', index: '03' },
  { id: 'cozy', label: 'Cozy', index: '04' },
  { id: 'sexy', label: 'Sexy', index: '05' },
  { id: 'dark', label: 'Dark', index: '06' },
  { id: 'office', label: 'Office', index: '07' },
  { id: 'woody', label: 'Woody', index: '08' },
  { id: 'floral', label: 'Floral', index: '09' },
  { id: 'spicy', label: 'Spicy', index: '10' },
  { id: 'aquatic', label: 'Aquatic', index: '11' },
  { id: 'fruity', label: 'Fruity', index: '12' }
];

interface VisualCategoryNavProps {
  onSelectCategory?: (slug: string) => void;
  activeCategory?: string;
}

const VisualCategoryNav = ({ onSelectCategory, activeCategory }: VisualCategoryNavProps) => {
  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="relative">
        {/* Scent Index Grid */}
        <div className="flex overflow-x-auto pb-12 pt-4 gap-4 md:grid md:grid-cols-4 lg:grid-cols-7 md:gap-4 hide-scrollbar -mx-6 px-6">
          {VIBE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            
            const content = (
              <div className={`
                relative h-24 md:h-32 p-4 md:p-6 flex flex-col justify-between transition-all duration-500 group overflow-hidden
                border ${isActive ? 'border-stone-900 bg-stone-900' : 'border-stone-100 hover:border-stone-300 bg-white'}
              `}>
                {/* Catalog Number */}
                <div className="flex justify-between items-start">
                  <span className={`
                    text-[9px] font-bold tracking-widest transition-colors
                    ${isActive ? 'text-stone-400' : 'text-stone-300 group-hover:text-stone-500'}
                  `}>
                    [{cat.index}]
                  </span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="w-1 h-1 bg-white rounded-full"
                    />
                  )}
                </div>

                {/* Scent Label */}
                <div className="relative z-10">
                   <h4 className={`
                    font-serif text-lg md:text-xl transition-all duration-500
                    ${isActive ? 'text-white' : 'text-stone-900'}
                  `}>
                    {cat.label}
                  </h4>
                  <div className={`
                    h-px mt-2 transition-all duration-700
                    ${isActive ? 'w-full bg-stone-700' : 'w-0 bg-stone-900 group-hover:w-4'}
                  `} />
                </div>

                {/* Decorative background number for depth */}
                <span className={`
                   absolute -bottom-4 -right-2 text-6xl font-serif italic opacity-[0.03] transition-all duration-700 pointer-events-none
                   ${isActive ? 'text-white opacity-10' : 'text-stone-900'}
                `}>
                  {cat.index}
                </span>
              </div>
            );

            const containerClassName = "block w-[160px] md:w-auto shrink-0";

            if (onSelectCategory) {
              return (
                <button 
                  key={cat.id} 
                  onClick={() => onSelectCategory(cat.id)}
                  className={containerClassName}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link 
                key={cat.id} 
                href={cat.id === 'all' ? '/search' : `/search?vibe=${cat.id}`}
                className={containerClassName}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VisualCategoryNav;
