export default function MixPyramid({ perfumeA, perfumeB, ratio }: { perfumeA: any, perfumeB: any, ratio: number }) {
  // Helper to extract notes by type
  const getNotes = (p: any, type: string) => 
    p?.perfume_notes?.filter((n: any) => n.type === type).map((n: any) => n.note.name) || [];

  const renderLevel = (title: string, type: string, width: string) => { 
    const notesA = getNotes(perfumeA, type); 
    const notesB = getNotes(perfumeB, type);

    // Dynamic Opacity based on Ratio (High Ratio = Mostly A visible)
    const opacityA = ratio < 30 ? 'opacity-40' : 'opacity-100';
    const opacityB = ratio > 70 ? 'opacity-40' : 'opacity-100';
    
    return (
      <div className={`flex flex-col items-center ${width}`}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">{title}</div>
        <div className="w-full bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap justify-center gap-2 shadow-sm min-h-[60px]">
          {/* Perfume A Notes (Base Layer) */}
          {notesA.map((n: string) => (
            <span key={n} className={`text-xs text-stone-800 bg-stone-100 px-2 py-1 rounded border border-stone-200 transition-opacity duration-300 ${opacityA}`}>
              {n}
            </span>
          ))}
          {/* Perfume B Notes (Top Layer) */}
          {notesB.map((n: string) => (
            <span key={n} className={`text-xs text-stone-600 bg-white px-2 py-1 rounded border border-stone-100 transition-opacity duration-300 ${opacityB}`}>
              {n}
            </span>
          ))}
          {notesA.length === 0 && notesB.length === 0 && <span className="text-[10px] text-stone-300 italic">No notes</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto relative py-8">
      {/* Connector Line */}
      <div className="absolute top-10 bottom-10 left-1/2 w-px bg-stone-200 -z-10"></div>
      
      {renderLevel('Top Notes', 'Top', 'w-2/3')}
      {renderLevel('Heart Notes', 'Heart', 'w-5/6')}
      {renderLevel('Base Notes', 'Base', 'w-full')}
    </div>
  );
}