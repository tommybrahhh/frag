'use client';

interface MixPyramidProps {
  perfumeA: any;
  perfumeB: any;
  ratio: number; // 0-100, percentage of perfumeA
}

interface NoteCategory {
  top: string[];
  heart: string[];
  base: string[];
}

const NOTE_CATEGORIES: NoteCategory = {
  top: ['citrus', 'fresh', 'fruity', 'green', 'aquatic'],
  heart: ['floral', 'spicy', 'herbal', 'tea'],
  base: ['woody', 'amber', 'musk', 'vanilla', 'leather', 'tobacco', 'oriental']
};

export default function MixPyramid({ perfumeA, perfumeB, ratio }: MixPyramidProps) {
  if (!perfumeA || !perfumeB) return null;

  // Extract notes from perfumes
  const getNotes = (perfume: any): string[] => {
    return perfume.perfume_notes?.map((pn: any) => pn.note?.name) || [];
  };

  const notesA = getNotes(perfumeA);
  const notesB = getNotes(perfumeB);

  // Categorize notes
  const categorizeNotes = (notes: string[]) => {
    const categorized = {
      top: [] as string[],
      heart: [] as string[],
      base: [] as string[]
    };

    notes.forEach(note => {
      const noteLower = note.toLowerCase();
      
      if (NOTE_CATEGORIES.top.some(cat => noteLower.includes(cat))) {
        categorized.top.push(note);
      } else if (NOTE_CATEGORIES.heart.some(cat => noteLower.includes(cat))) {
        categorized.heart.push(note);
      } else if (NOTE_CATEGORIES.base.some(cat => noteLower.includes(cat))) {
        categorized.base.push(note);
      }
    });

    return categorized;
  };

  const categorizedA = categorizeNotes(notesA);
  const categorizedB = categorizeNotes(notesB);

  // Calculate opacity based on ratio
  const getOpacity = (isPerfumeB: boolean): number => {
    if (isPerfumeB) {
      // Perfume B notes become more transparent as ratio favors A
      return Math.max(0.3, 1 - (ratio / 100));
    } else {
      // Perfume A notes become more transparent as ratio favors B
      return Math.max(0.3, ratio / 100);
    }
  };

  const renderSection = (title: string, notesA: string[], notesB: string[]) => {
    const opacityA = getOpacity(false);
    const opacityB = getOpacity(true);

    return (
      <div className="border border-stone-200 p-3">
        <div className="text-xs font-bold uppercase text-stone-500 mb-2">{title}</div>
        <div className="space-y-1">
          {/* Perfume A Notes */}
          {notesA.map((note, index) => (
            <div
              key={`a-${note}-${index}`}
              className="text-xs text-stone-800 bg-stone-100 px-2 py-1 rounded"
              style={{ opacity: opacityA }}
            >
              {note} {ratio > 70 && '👑'}
            </div>
          ))}
          
          {/* Perfume B Notes */}
          {notesB.map((note, index) => (
            <div
              key={`b-${note}-${index}`}
              className="text-xs text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-100"
              style={{ opacity: opacityB }}
            >
              {note} {ratio < 30 && '👑'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="text-sm font-bold text-stone-800 mb-3">Scent Pyramid</div>
      
      {/* Triangle Visualization */}
      <div className="relative w-full h-48 mb-4">
        {/* Triangle Outline */}
        <div className="absolute inset-0 border-2 border-stone-300 rounded-lg transform -skew-y-6"></div>
        
        {/* Horizontal Sections */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {/* Top Section - 25% */}
          <div className="h-1/4 border-b border-stone-200 flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase text-stone-500">Top</span>
          </div>
          
          {/* Heart Section - 35% */}
          <div className="h-2/5 border-b border-stone-200 flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase text-stone-500">Heart</span>
          </div>
          
          {/* Base Section - 40% */}
          <div className="h-2/5 flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase text-stone-500">Base</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Top Notes */}
        {renderSection('Top Notes', categorizedA.top, categorizedB.top)}
        
        {/* Heart Notes */}
        {renderSection('Heart Notes', categorizedA.heart, categorizedB.heart)}
        
        {/* Base Notes */}
        {renderSection('Base Notes', categorizedA.base, categorizedB.base)}
      </div>

      <div className="mt-3 text-xs text-stone-500 text-center">
        Ratio: {ratio}% {perfumeA.name} / {100 - ratio}% {perfumeB.name}
      </div>
    </div>
  );
}