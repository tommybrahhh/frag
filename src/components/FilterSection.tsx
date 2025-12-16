import { FilterSectionProps } from './filterTypes';

export default function FilterSection({ title, options, selected, onChange }: FilterSectionProps) {
  return (
    <section 
      aria-labelledby={`${title.toLowerCase().replace(' ', '-')}-title`}
      className="w-full max-w-[1400px] mx-auto px-4 sm:px-6"
    >
      <h3 
        id={`${title.toLowerCase().replace(' ', '-')}-title`} 
        className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3"
      >
        {title}
      </h3>
      <div 
        role="group" 
        aria-labelledby={`${title.toLowerCase().replace(' ', '-')}-title`}
        className="w-full"
      >
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            aria-pressed={selected.includes(option)}
            className={`w-full text-left text-sm transition-all px-3 py-1.5 rounded-md ${
              selected.includes(option)
                ? 'font-bold text-stone-900 bg-stone-100'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}