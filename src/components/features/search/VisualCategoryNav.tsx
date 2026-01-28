'use client';

import Link from 'next/link';
import Image from 'next/image';

const VIBE_CATEGORIES = [
  { 
    id: 'clean', 
    label: 'Clean', 
    icon: '/assets/clean.png', // We will need to ensure these assets exist or use placeholders
    color: 'bg-blue-50',
    slug: 'clean'
  },
  { 
    id: 'date-night', 
    label: 'Date Night', 
    icon: '/assets/eart.png', // Placeholder
    color: 'bg-rose-50',
    slug: 'sexy' // Mapping UI label to DB tag
  },
  { 
    id: 'daily', 
    label: 'Daily Driver', 
    icon: '/assets/modern.png', // Placeholder
    color: 'bg-green-50',
    slug: 'office' // Mapping UI label to DB tag
  },
  { 
    id: 'sweet', 
    label: 'Gourmand', 
    icon: '/assets/gourmand.png', 
    color: 'bg-amber-50',
    slug: 'sweet'
  },
  {
    id: 'all',
    label: 'All Scents',
    icon: '/assets/all.png',
    color: 'bg-stone-100',
    slug: ''
  }
];

interface VisualCategoryNavProps {
  onSelectCategory?: (slug: string) => void;
  activeCategory?: string;
}

const VisualCategoryNav = ({ onSelectCategory, activeCategory }: VisualCategoryNavProps) => {
  return (
    <div className="max-w-[1400px] mx-auto px-6 mb-16">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-serif text-2xl text-stone-900">Shop by Vibe</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {VIBE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.slug;
          
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.slug)}
              className={`
                group min-w-[100px] flex flex-col items-center gap-3 transition-all duration-300
                ${isActive ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}
              `}
            >
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center shadow-sm border border-stone-100 transition-all duration-300
                ${cat.color} group-hover:shadow-md
                ${isActive ? 'ring-2 ring-stone-900 ring-offset-2' : ''}
              `}>
                <div className="relative w-10 h-10">
                   {/* Fallback to text if image fails or for prototyping */}
                   <span className="text-[10px] font-bold text-stone-400 absolute inset-0 flex items-center justify-center">
                     {cat.label[0]}
                   </span>
                </div>
              </div>
              <span className={`
                text-xs font-bold uppercase tracking-widest text-center
                ${isActive ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-700'}
              `}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VisualCategoryNav;
