'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PerfumePicker from '@/components/PerfumePicker';
import { ratingToHourRange, ratingToDescription } from '@/lib/longevity-utils';

interface CompareClientViewProps {
  initialPerfumes: any[]; // The perfumes fetched by the server
}

const OCCASIONS = ['Date Night', 'Office Safe', 'Casual Daily', 'Formal Event', 'Party / Club', 'Summer Vacation', 'Gym / Sport'];

// Helper function for Sillage description
const getSillageDescription = (rating: number | null | undefined): string => {
  if (rating === null || rating === undefined) return 'Moderate';
  if (rating >= 1 && rating <= 3) return 'Intimate';
  if (rating >= 4 && rating <= 5) return 'Moderate';
  if (rating >= 6 && rating <= 7) return 'Strong';
  if (rating === 8) return 'Enormous';
  if (rating === 9) return 'Beast Mode';
  if (rating === 10) return 'Suffocating';
  return 'Moderate'; // Default for out-of-range values
};

export default function CompareClientView({ initialPerfumes }: CompareClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for the comparison slots. 
  // We initialize based on URL params but allow local manipulation before pushing URL?
  // Actually, immediate URL update is better for "shareability".
  // But for smooth UX, maybe local state + URL sync.
  
  const [slots, setSlots] = useState<(any | null)[]>([null, null]); // Start with 2 slots
  
  // Sync state with props when they change (on navigation)
  useEffect(() => {
    // If we have initial perfumes, map them to slots. 
    // Always ensure at least 2 slots, or length + 1 if we want an empty adder?
    // User wants "up to 4".
    
    // We map the initialPerfumes to the slots array.
    // If we have 0 perfumes, [null, null]
    // If we have 1 perfume, [p1, null]
    // If we have 2 perfumes, [p1, p2]
    // If we have 3, [p1, p2, p3]
    
    // Check if we need to expand slots based on data
    const newSlots = [...initialPerfumes];
    while (newSlots.length < 2) {
      newSlots.push(null);
    }
    // If we have fewer than 4 slots and all are full, maybe add an empty one? 
    // Or let user click "+".
    // Let's stick to the current logic: fill with data, pad to 2 if needed.
    // We preserve the existing slot count if it's larger than needed, unless we are resetting?
    // Actually, simple logic:
    // 1. Create array from data.
    // 2. If length < 2, push nulls until 2.
    // 3. If length >= 2 and < 4, push one null? No, user explicitly clicks "+".
    // Wait, if I paste a URL with 3 IDs, I want 3 slots filled.
    
    setSlots(prev => {
        // If the data changed significantly, reset/fill.
        // Simple approach: Just use data + pad to 2.
        // But if user manually added a 3rd empty slot, we want to keep it?
        // Let's just reset to data + padding for now to ensure consistency with URL.
        const base = [...initialPerfumes];
        while (base.length < 2) base.push(null);
        return base;
    });
  }, [initialPerfumes]);

  const updateUrl = (newSlots: any[]) => {
    const ids = newSlots.filter(p => p !== null).map(p => p.id);
    const params = new URLSearchParams();
    if (ids.length > 0) {
        params.set('ids', ids.join(','));
    }
    router.push(`/compare?${params.toString()}`);
  };

  const handleSelect = (index: number, perfume: any) => {
    const newSlots = [...slots];
    newSlots[index] = perfume;
    setSlots(newSlots);
    updateUrl(newSlots);
  };

  const handleAddSlot = () => {
    if (slots.length < 4) {
      setSlots([...slots, null]);
    }
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    // Ensure at least 1 slot? Or 2? 
    // Let's ensure at least 1 empty slot if all are gone, or min 2 slots total?
    // User said "from 1 up to 4".
    if (newSlots.length === 0) {
        newSlots.push(null);
    }
    setSlots(newSlots);
    updateUrl(newSlots);
  };

  // Helper Functions
  const getPriceTierValue = (priceTier: string | null): number => {
    if (!priceTier) return 0;
    return priceTier.split('$').length - 1;
  };

  const checkOccasion = (p: any, occasion: string) => {
    if (p.occasions?.includes(occasion)) return true;
    const vibes = (p.vibe_tags || []).map((v: string) => v.toLowerCase());
    const seasons = p.best_season || [];
    
    if (occasion === 'Date Night' && (vibes.includes('sexy') || vibes.includes('romantic') || vibes.includes('intimate'))) return true;
    if (occasion === 'Office Safe' && (vibes.includes('clean') || vibes.includes('fresh') || (p.sillage_rating && p.sillage_rating <= 3))) return true;
    if (occasion === 'Party / Club' && (vibes.includes('loud') || vibes.includes('bold') || (p.sillage_rating && p.sillage_rating >= 6))) return true;
    if (occasion === 'Summer Vacation' && (seasons.includes('Summer') || vibes.includes('tropical'))) return true;
    if (occasion === 'Gym / Sport' && (vibes.includes('sporty') || vibes.includes('energy'))) return true;
    return false;
  };

  const getNotes = (p: any, type: string) => {
    return p.perfume_notes?.filter((n: any) => n.type === type) || [];
  };

  const getProfileKeys = () => {
    const allKeys = new Set<string>();
    slots.forEach(p => {
        if (p?.scent_profile) {
            Object.keys(p.scent_profile).forEach(k => allKeys.add(k));
        }
    });
    return Array.from(allKeys);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans pb-20">
        
        {/* Header / Nav */}
        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-16 z-20">
            <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Battle Analysis</span>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 mt-8">
            
            {/* 1. SELECTION BAR */}
            <div className="flex flex-col md:flex-row gap-4 items-start mb-12">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {slots.map((slot, index) => (
                        <div key={index} className="relative">
                            <PerfumePicker 
                                label={`Fighter ${index + 1}`} 
                                onSelect={(p) => handleSelect(index, p)} 
                                selected={slot} 
                                placeholder="Search perfume..."
                            />
                            {/* Remove Button (only if count > 1 or resetting) */}
                            {/* Actually PerfumePicker handles 'x' to clear selection. 
                                We might want to remove the SLOT entirely if user wants to reduce count.
                                But PerfumePicker's 'x' calls onSelect(null).
                                We can add a separate 'Trash' icon to remove the slot if it's not the last one or something.
                                Let's keep it simple: 'x' in picker clears. 
                                But user asked "insert more comparisons... by clicking on +".
                                So we need a way to REMOVE a slot too?
                                Let's add a small trash icon above the picker?
                            */}
                            {slots.length > 1 && (
                                <button 
                                    onClick={() => handleRemoveSlot(index)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-stone-200 rounded-full text-stone-500 text-xs flex items-center justify-center hover:bg-red-500 hover:text-white transition z-20"
                                    title="Remove Slot"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {/* Add Button */}
                    {slots.length < 4 && (
                        <div className="relative">
                            <div className="mb-2 px-1 opacity-0">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Add Slot</span>
                            </div>
                            <button 
                                onClick={handleAddSlot}
                                className="w-full h-[88px] bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:text-stone-800 hover:border-stone-400 hover:shadow-md transition-all group"
                            >
                                <span className="w-8 h-8 rounded-full bg-stone-50 group-hover:bg-stone-100 flex items-center justify-center mb-1 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest">Add Fighter</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. COMPARISON TABLE */}
            {initialPerfumes.length > 0 && (
                <div className="overflow-x-auto">
                    {/* HEADER ROW (Images) */}
                    <div className="grid gap-8 min-w-[600px]" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
                        {slots.map((p, i) => (
                            <div key={i} className="text-center">
                                {p ? (
                                    <>
                                        <div className="h-48 flex items-center justify-center mb-4 p-4 bg-white rounded-xl border border-stone-100 shadow-sm relative">
                                            {p.image_url ? (
                                                <img src={p.image_url} className="h-full object-contain mix-blend-multiply" />
                                            ) : (
                                                <span className="text-stone-300 text-xs">No Image</span>
                                            )}
                                            <div className="absolute top-2 right-2 bg-stone-900 text-white text-[9px] font-bold px-2 py-1 rounded">
                                                {p.rating?.toFixed(1) || '-'}
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate px-2">{p.brand?.name}</div>
                                        <Link href={`/perfume/${p.id}`} className="font-serif text-xl text-stone-900 hover:underline decoration-stone-300 underline-offset-4 line-clamp-2 h-14">
                                            {p.name}
                                        </Link>
                                    </>
                                ) : (
                                    <div className="h-48 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 flex items-center justify-center text-stone-300 text-sm">
                                        Empty
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 space-y-12 min-w-[600px]">
                        
                        {/* BASIC SPECS */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="bg-stone-50 px-6 py-3 border-b border-stone-200">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Specifications</h3>
                            </div>
                            
                            {/* Price */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center">Price</div>
                                {slots.map((p, i) => (
                                    <div key={i} className="p-4 text-center font-mono text-sm text-stone-600 border-l border-stone-100">
                                        {p?.price_tier || '-'}
                                    </div>
                                ))}
                            </div>

                            {/* Longevity */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center">Longevity</div>
                                {slots.map((p, i) => (
                                    <div key={i} className="p-4 text-center text-sm font-medium text-stone-800 border-l border-stone-100">
                                        {p?.longevity_rating ? ratingToDescription(p.longevity_rating) : '-'}
                                    </div>
                                ))}
                            </div>

                            {/* Sillage */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                                               <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center">Sillage</div>
                                                               {slots.map((p, i) => (
                                                                   <div key={i} className="p-4 text-center border-l border-stone-100">
                                                                       {p ? (
                                                                           <div className="flex flex-col items-center justify-center gap-1">
                                                                                <span className="text-xs font-medium text-stone-800 mb-1">{getSillageDescription(p.sillage_rating)}</span>
                                                                                <div className="flex items-center justify-center gap-1">
                                                                                    {[1,2,3,4,5,6,7,8,9,10].map(star => (
                                                                                        <div key={star} className={`h-1.5 w-3 rounded-full ${star <= (p.sillage_rating || 0) ? 'bg-stone-800' : 'bg-stone-200'}`}></div>
                                                                                    ))}
                                                                                </div>
                                                                           </div>
                                                                       ) : '-'}
                                                                   </div>
                                                               ))}                            </div>

                            {/* Gender */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center">Gender</div>
                                {slots.map((p, i) => (
                                    <div key={i} className="p-4 text-center text-sm text-stone-600 border-l border-stone-100">
                                        {p?.gender || '-'}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SCENT PROFILE RADAR */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-6">Olfactory DNA</h3>
                            {getProfileKeys().map((key) => (
                                <div key={key} className="mb-4 last:mb-0">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900">{key}</span>
                                    </div>
                                    <div className="flex gap-2 h-2">
                                        {slots.map((p, i) => {
                                            const val = p?.scent_profile?.[key] || 0;
                                            return (
                                                <div key={i} className="flex-1 bg-stone-100 rounded-full overflow-hidden relative">
                                                    {p && (
                                                        <div 
                                                            className={`h-full opacity-80 ${['bg-stone-800', 'bg-emerald-600', 'bg-amber-500', 'bg-blue-500'][i % 4]}`} 
                                                            style={{ width: `${val * 10}%` }}
                                                            title={`${p.name}: ${val}/10`}
                                                        ></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* OCCASIONS */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="bg-stone-50 px-6 py-3 border-b border-stone-200">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Occasions</h3>
                            </div>
                            {OCCASIONS.map((occasion) => (
                                <div key={occasion} className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition items-center" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                    <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 leading-tight">{occasion}</div>
                                    {slots.map((p, i) => {
                                        const fits = p ? checkOccasion(p, occasion) : false;
                                        return (
                                            <div key={i} className="p-4 text-center border-l border-stone-100">
                                                {fits ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-stone-200">·</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* NOTES */}
                        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
                            {slots.map((p, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                                    {p ? (
                                        <div className="space-y-8">
                                            {['Top', 'Heart', 'Base'].map(type => (
                                                <div key={type}>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 border-b border-stone-100 pb-2">{type} Notes</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {getNotes(p, type).map((n: any) => (
                                                            <span key={n.note.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: n.note.color_hex }}></span>
                                                                {n.note.name}
                                                            </span>
                                                        ))}
                                                        {getNotes(p, type).length === 0 && <span className="text-xs text-stone-300 italic">None</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-stone-300 text-xs italic text-center pt-10">Empty Slot</div>
                                    )}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}

        </div>
    </div>
  );
}