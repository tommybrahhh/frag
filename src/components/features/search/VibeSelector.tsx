'use client';

interface VibeSelectorProps {
  selectedVibe: string;
  onSelectVibe: (vibe: string) => void;
}

const vibes = ['All', 'Fresh', 'Sweet', 'Cozy', 'Sexy', 'Dark', 'Office', 'Date Night', 'Woody'];

export default function VibeSelector({ selectedVibe, onSelectVibe }: VibeSelectorProps) {
  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-3 px-1">
        {vibes.map((vibe) => (
          <button
            key={vibe}
            onClick={() => onSelectVibe(vibe)}
            className={`
              px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap
              ${selectedVibe === vibe
                ? 'bg-stone-900 text-white border border-stone-900 shadow-md'
                : 'bg-transparent text-stone-500 border border-stone-200 hover:border-stone-400 hover:text-stone-800'
              }
            `}
          >
            {vibe}
          </button>
        ))}
      </div>
    </div>
  );
}
