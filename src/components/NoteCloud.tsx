'use client';

import React from 'react';

interface NoteCloudProps {
  perfumeA: any;
  perfumeB: any;
  ratio: number; // 0 to 100, where 0 is 100% B, 100 is 100% A (Wait, conventionally A is Left/Base, B is Right/Top)
                 // Let's stick to the convention in page.tsx: 
                 // ratio is "Base %" (slot1). So 50 means 50% Slot1.
}

export default function NoteCloud({ perfumeA, perfumeB, ratio }: NoteCloudProps) {
  // Extract notes
  const getNotes = (p: any) => p?.perfume_notes?.map((n: any) => ({ name: n.note.name, type: n.type })) || [];
  
  const notesA = getNotes(perfumeA);
  const notesB = getNotes(perfumeB);

  // Combine unique notes
  const allNoteNames = Array.from(new Set([...notesA.map((n:any) => n.name), ...notesB.map((n:any) => n.name)]));

  // Determine size/opacity based on ratio
  // ratio is Base (A) percentage.
  // If ratio is 80, A's notes are 0.8 weight, B's are 0.2 weight.
  const weightA = ratio / 100;
  const weightB = 1 - weightA;

  const notesWithWeight = allNoteNames.map(name => {
    const inA = notesA.some((n:any) => n.name === name);
    const inB = notesB.some((n:any) => n.name === name);
    
    let weight = 0;
    if (inA) weight += weightA;
    if (inB) weight += weightB;
    
    // If note is in both, it gets full weight (1.0). 
    // If only in A, it scales with A's ratio.
    
    // Type classification (prioritize Base > Heart > Top for visual grouping if we wanted, 
    // but random cloud is fine too). Let's grab the type from A or B.
    const noteObj = notesA.find((n:any) => n.name === name) || notesB.find((n:any) => n.name === name);
    
    return { name, weight, type: noteObj?.type };
  });

  // Sort by weight descending so big notes are in middle/first
  notesWithWeight.sort((a, b) => b.weight - a.weight);

  // Helper for size class
  const getSize = (w: number) => {
    if (w >= 0.8) return 'text-xl md:text-2xl font-bold opacity-100';
    if (w >= 0.5) return 'text-lg md:text-xl font-semibold opacity-80';
    if (w >= 0.3) return 'text-sm md:text-base opacity-60';
    return 'text-xs opacity-40';
  };

  return (
    <div className="h-48 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="flex flex-wrap justify-center items-center gap-3 transition-all duration-500 ease-in-out">
            {notesWithWeight.map(n => (
                <span 
                    key={n.name} 
                    className={`font-serif transition-all duration-500 ease-in-out ${getSize(n.weight)}`}
                    style={{ transform: `scale(${0.8 + (n.weight * 0.4)})` }}
                >
                    {n.name}
                </span>
            ))}
            {notesWithWeight.length === 0 && (
                <span className="text-stone-300 text-sm italic">Add perfumes to see the note cloud...</span>
            )}
        </div>
    </div>
  );
}
