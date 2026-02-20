'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Database } from '@/types/database';

// Type definitions needed for this component
type Note = {
  name: string;
  color_hex?: string;
  description?: string;
  url?: string;
};

type PerfumeNote = {
  type: string;
  note: Note;
};

type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
  perfume_notes?: PerfumeNote[];
};

interface PerfumePyramidProps {
  perfume: Perfume;
}

export default function PerfumePyramid({ perfume }: PerfumePyramidProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // --- TREEMAP SUB-COMPONENTS ---

  const TreemapTile = ({ noteData, className }: { noteData: PerfumeNote, className?: string }) => {
    const noteName = noteData.note.name;
    const noteSlug = noteName.toLowerCase().replace(/\s+/g, '-');
    const isActive = activeNote === noteName;

    const imageSrc = noteData.note.url;

    return (
      <div className={`relative group overflow-hidden border border-white/50 ${className}`} 
           style={{ backgroundColor: !imageSrc ? (noteData.note.color_hex || '#e7e5e4') : 'transparent' }}>
        <button
          onClick={() => setActiveNote(isActive ? null : noteName)}
          className="w-full h-full relative block"
        >
          {/* Background Image */}
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={noteName}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                  // Fallback to background color if image fails
                  (e.target as HTMLImageElement).style.opacity = '0';
                  (e.target as HTMLImageElement).parentElement!.style.backgroundColor = noteData.note.color_hex || '#e7e5e4';
              }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: noteData.note.color_hex || '#e7e5e4' }} />
          )}
          
          {/* Overlay & Text */}
          <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center p-2 ${isActive ? 'bg-black/50' : 'bg-black/10 group-hover:bg-black/30'}`}>
             <span className={`text-white font-bold uppercase tracking-widest drop-shadow-md text-center break-words ${isActive ? 'text-xs' : 'text-[10px] md:text-xs'}`}>
                {noteName}
             </span>
          </div>

          {/* Active State Border */}
          {isActive && <div className="absolute inset-0 border-2 border-white z-20"></div>}
        </button>

        {/* Tooltip Popup */}
        {isActive && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900/95 backdrop-blur text-white text-xs p-4 rounded-xl shadow-2xl w-[90%] md:w-56 text-center z-50 animate-in fade-in zoom-in-95 duration-200 border border-stone-700">
                <p className="mb-3 font-serif leading-relaxed text-stone-200">
                    {noteData.note.description || "A defining note."}
                </p>
                <Link href={`/ingredients/${encodeURIComponent(noteName)}`} className="inline-block uppercase font-bold tracking-widest text-[9px] text-[#A8A29E] hover:text-white border-b border-stone-700 hover:border-white pb-0.5 transition-colors">
                    Explore →
                </Link>
            </div>
        )}
      </div>
    );
  };

  const TreemapSection = ({ title, type, notes, heightClass }: { title: string, type: string, notes: PerfumeNote[], heightClass: string }) => {
    const isEmpty = !notes || notes.length === 0;

    return (
        <div className={`relative flex w-full ${heightClass} border-b border-stone-100 last:border-b-0`}>
            
            {/* Label (Side Tab) */}
            <div className={`w-8 md:w-12 flex-shrink-0 flex items-center justify-center bg-stone-100 border-r border-stone-200`}>
                 <span className="block -rotate-90 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 whitespace-nowrap">
                    {title}
                 </span>
            </div>

            {/* Content Area (The Map) */}
            <div className="flex-grow relative bg-stone-50">
                 {isEmpty ? (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs italic border border-dashed border-stone-200 m-2">
                        No {type.toLowerCase()} notes listed
                    </div>
                 ) : (
                    <div className="flex flex-wrap w-full h-full content-stretch">
                        {notes.map((note, idx) => {
                             return (
                                <div 
                                    key={idx} 
                                    className="flex-grow basis-[45%] md:basis-[30%]" 
                                    style={{ flexGrow: (notes.length % 2 !== 0 && idx === 0) ? 2 : 1 }}
                                >
                                    <TreemapTile noteData={note} className="w-full h-full" />
                                </div>
                             )
                        })}
                    </div>
                 )}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full md:min-h-[600px] lg:min-h-[700px]">
      {/* Header - Unified with Dashboard Style */}
      <div className="pb-2 mb-6 border-b border-stone-200 flex justify-between items-center">
          <h4 className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 w-full">
            Scent Architecture <span className="flex-1 h-px bg-stone-200"></span>
          </h4>
          <span className="text-[8px] md:text-[9px] text-stone-400 uppercase font-bold tracking-tighter whitespace-nowrap ml-4">Tap for info</span>
      </div>

      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-stone-100">
        {/* 1. TOP NOTES (Smallest - 20%) */}
        <TreemapSection 
           title="Top" 
           type="Top"
           notes={perfume.perfume_notes?.filter(n => n.type === 'Top') || []} 
           heightClass="h-[120px] md:h-[20%]" 
        />

        {/* 2. HEART NOTES (Mid - 30%) */}
        <TreemapSection 
           title="Heart" 
           type="Heart"
           notes={perfume.perfume_notes?.filter(n => n.type === 'Heart') || []} 
           heightClass="h-[180px] md:h-[30%]" 
        />

        {/* 3. BASE NOTES (Biggest - 50%) */}
        <TreemapSection 
           title="Base" 
           type="Base"
           notes={perfume.perfume_notes?.filter(n => n.type === 'Base') || []} 
           heightClass="h-[250px] md:h-[50%]" 
        />
      </div>
    </div>
  );
}
