'use client';

export default function MixPyramid({ perfumeA, perfumeB, ratio }: { perfumeA: any, perfumeB: any, ratio: number }) {
  // Helper to extract notes by type
  const getNotes = (p: any, type: string) => 
    p?.perfume_notes?.filter((n: any) => n.type === type).map((n: any) => n.note.name) || [];

  const renderRow = (label: string, type: string) => {
    const notesA = getNotes(perfumeA, type);
    const notesB = getNotes(perfumeB, type);
    
    // Dynamic Opacity
    const opacityA = ratio < 30 ? 'opacity-40 grayscale' : 'opacity-100';
    const opacityB = ratio > 70 ? 'opacity-40 grayscale' : 'opacity-100';

    if (notesA.length === 0 && notesB.length === 0) return null;

    return (
      <div className="grid grid-cols-[50px_1fr] gap-4 items-center border-b border-stone-100 last:border-0 py-3 last:pb-0 first:pt-0">
        {/* Label Column */}
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 text-right">
          {label}
        </span>
        
        {/* Notes Column */}
        <div className="flex flex-wrap gap-1.5">
          {notesA.map((n: string) => (
            <span key={n} className={`px-2 py-0.5 bg-stone-50 border border-stone-200 rounded-md text-[10px] text-stone-600 font-medium transition-all duration-500 ${opacityA}`}>
              {n}
            </span>
          ))}
          {notesB.map((n: string) => (
            <span key={n} className={`px-2 py-0.5 bg-white border border-stone-200 rounded-md shadow-sm text-[10px] text-stone-900 font-bold transition-all duration-500 ${opacityB}`}>
              {n}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-stone-50/30 rounded-2xl p-5 border border-stone-100">
      <div className="flex flex-col">
        {renderRow('Top', 'Top')}
        {renderRow('Heart', 'Heart')}
        {renderRow('Base', 'Base')}
      </div>
    </div>
  );
}
