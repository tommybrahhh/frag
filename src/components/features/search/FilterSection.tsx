import { FilterSectionProps } from './filterTypes';
import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FilterSection({ 
  title, 
  options, 
  selected, 
  onChange,
  icon
}: FilterSectionProps & { icon?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section 
      aria-labelledby={`${title.toLowerCase().replace(' ', '-')}-title`}
      className="w-full group"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-4 group/btn"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-stone-400 group-hover:text-stone-600 transition-colors group-hover/btn:text-stone-600">{icon}</span>}
          <h3 
            id={`${title.toLowerCase().replace(' ', '-')}-title`} 
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-500 transition-colors group-hover/btn:text-stone-500"
          >
            {title} {selected.length > 0 && <span className="text-stone-900 ml-1">({selected.length})</span>}
          </h3>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div 
          role="group" 
          aria-labelledby={`${title.toLowerCase().replace(' ', '-')}-title`}
          className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => onChange(option)}
                aria-pressed={isSelected}
                className={`
                  text-sm px-3 py-1.5 rounded-full border transition-all duration-200
                  ${isSelected 
                    ? 'bg-stone-900 text-white border-stone-900 font-medium shadow-sm' 
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
                  }
                `}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
