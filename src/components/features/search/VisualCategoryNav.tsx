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
    <div className="max-w-[1400px] mx-auto px-6 mb-16">
      <div className="flex items-center justify-center mb-10">
        <h3 className="font-serif text-3xl text-stone-900">Explore by Vibe</h3>
      </div>
      
      {/* 
         Changed from horizontal scroll to a responsive grid/flex-wrap layout.
         - 'flex-wrap' ensures items wrap to the next line instead of scrolling off-screen.
         - 'justify-center' keeps the layout balanced regardless of screen size.
         - 'gap-6' gives enough breathing room.
      */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8">
        {VIBE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const Icon = cat.Icon;
          
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.slug)}
              className={`
                group flex flex-col items-center gap-3 transition-all duration-300
                ${isActive ? 'opacity-100 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}
              `}
            >
              <div className={`
                w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 transition-all duration-300
                ${isActive ? 'bg-stone-900 text-white shadow-lg ring-2 ring-stone-900 ring-offset-2' : 'bg-stone-50 text-stone-600 hover:bg-white hover:shadow-md'}
              `}>
                <Icon 
                  className={`w-7 h-7 md:w-8 md:h-8 transition-colors ${isActive ? 'text-white' : 'text-stone-600 group-hover:text-stone-900'}`} 
                  strokeWidth={1.5}
                />
              </div>
              <span className={`
                text-[10px] md:text-xs font-bold uppercase tracking-widest text-center
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