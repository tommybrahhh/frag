import { FilterSectionProps } from './filterTypes';
import { ReactNode } from 'react';

export default function FilterSection({ 
  title, 
  options, 
  selected, 
  onChange,
  icon
}: FilterSectionProps & { icon?: ReactNode }) {
  return (
    <section 
      aria-labelledby={`${title.toLowerCase().replace(' ', '-')}-title`}
      className="w-full group"
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-stone-400 group-hover:text-stone-600 transition-colors">{icon}</span>}
        <h3 
          id={`${title.toLowerCase().replace(' ', '-')}-title`} 
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-500 transition-colors"
        >
          {title}
        </h3>
      </div>
      <div 
        role="group" 
        aria-labelledby={`${title.toLowerCase().replace(' ', '-')}-title`}
        className="flex flex-wrap gap-2"
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
    </section>
  );
}