'use client';

import { 
  Wind, 
  Sparkles, 
  Cherry, 
  Coffee, 
  Flame, 
  Moon, 
  Briefcase, 
  TreePine, 
  Flower2, 
  Zap, 
  Droplets, 
  Apple,
  Search
} from 'lucide-react';

const VIBE_CATEGORIES = [
  { 
    id: 'all',
    label: 'All Scents',
    Icon: Search,
    color: 'bg-stone-50',
    slug: ''
  },
  { 
    id: 'fresh', 
    label: 'Fresh', 
    Icon: Wind,
    color: 'bg-stone-50',
    slug: 'fresh'
  },
  { 
    id: 'sweet', 
    label: 'Sweet', 
    Icon: Cherry, 
    color: 'bg-stone-50',
    slug: 'sweet'
  },
  { 
    id: 'clean', 
    label: 'Clean', 
    Icon: Sparkles, 
    color: 'bg-stone-50',
    slug: 'clean'
  },
  { 
    id: 'cozy', 
    label: 'Cozy', 
    Icon: Coffee, 
    color: 'bg-stone-50',
    slug: 'cozy'
  },
  { 
    id: 'sexy', 
    label: 'Sexy', 
    Icon: Flame, 
    color: 'bg-stone-50',
    slug: 'sexy'
  },
  { 
    id: 'dark', 
    label: 'Dark', 
    Icon: Moon, 
    color: 'bg-stone-50',
    slug: 'dark'
  },
  { 
    id: 'office', 
    label: 'Office', 
    Icon: Briefcase, 
    color: 'bg-stone-50',
    slug: 'office'
  },
  { 
    id: 'woody', 
    label: 'Woody', 
    Icon: TreePine, 
    color: 'bg-stone-50',
    slug: 'woody'
  },
  { 
    id: 'floral', 
    label: 'Floral', 
    Icon: Flower2, 
    color: 'bg-stone-50',
    slug: 'floral'
  },
  { 
    id: 'spicy', 
    label: 'Spicy', 
    Icon: Zap, 
    color: 'bg-stone-50',
    slug: 'spicy'
  },
  { 
    id: 'aquatic', 
    label: 'Aquatic', 
    Icon: Droplets, 
    color: 'bg-stone-50',
    slug: 'aquatic'
  },
  { 
    id: 'fruity', 
    label: 'Fruity', 
    Icon: Apple, 
    color: 'bg-stone-50',
    slug: 'fruity'
  }
];

interface VisualCategoryNavProps {
  onSelectCategory?: (slug: string) => void;
  activeCategory?: string;
}

const VisualCategoryNav = ({ onSelectCategory, activeCategory }: VisualCategoryNavProps) => {
  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="relative group/scroll">
        {/* Mobile scroll indicator fade */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-stone-50 to-transparent z-10 pointer-events-none md:hidden" />
        
        <div className="flex overflow-x-auto pb-4 gap-4 md:gap-8 md:flex-wrap md:justify-center hide-scrollbar -mx-6 px-6">
          {VIBE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const Icon = cat.Icon;
            
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory?.(cat.slug)}
                className={`
                  group flex flex-col items-center gap-2.5 transition-all duration-300 shrink-0
                  ${isActive ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}
                `}
              >
                <div className={`
                  w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500
                  ${isActive ? 'bg-stone-900 text-white shadow-lg' : 'bg-white border border-stone-100 group-hover:border-stone-200 text-stone-600'}
                `}>
                  <Icon 
                    className="w-6 h-6 md:w-8 md:h-8" 
                    strokeWidth={1.2}
                  />
                </div>
                <span className={`
                  text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-center transition-colors
                  ${isActive ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-700'}
                `}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VisualCategoryNav;