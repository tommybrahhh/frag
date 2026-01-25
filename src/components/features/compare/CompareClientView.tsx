'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Trophy, DollarSign, Clock, Wind, Calendar } from 'lucide-react';
import PerfumePicker from '@/components/features/perfume/PerfumePicker';
import { ratingToDescription } from '@/lib/longevity-utils';

interface ComparePerfumeNote {
  type: string;
  note: {
    name: string;
    color_hex?: string;
  };
}

interface ComparePerfume {
  id: string;
  name: string;
  image_url?: string;
  rating?: number;
  brand?: { name: string };
  price_tier?: string;
  longevity_rating?: number;
  sillage_rating?: number;
  gender?: string;
  best_season?: string[];
  vibe_tags?: string[];
  scent_profile?: Record<string, number>;
  occasions?: string[];
  perfume_notes?: ComparePerfumeNote[];
}

interface CompareClientViewProps {
  initialPerfumes: ComparePerfume[];
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
  return 'Moderate';
};

export default function CompareClientView({ initialPerfumes }: CompareClientViewProps) {
  const router = useRouter();
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const mainImageRowRef = useRef<HTMLDivElement>(null);
  
  // Initialize slots. Ensure at least 2 slots.
  const [slots, setSlots] = useState<(ComparePerfume | null)[]>(() => {
    const base: (ComparePerfume | null)[] = [...initialPerfumes];
    while (base.length < 2) base.push(null);
    return base;
  });

  // Sync state with props when they change (on navigation)
  useEffect(() => {
    const finalSlots: (ComparePerfume | null)[] = [...initialPerfumes];
    while (finalSlots.length < 2) finalSlots.push(null);
    setSlots(finalSlots);
  }, [initialPerfumes]);

  // Handle Scroll for Sticky Header
  useEffect(() => {
    const handleScroll = () => {
        if (mainImageRowRef.current) {
            const rect = mainImageRowRef.current.getBoundingClientRect();
            // Show sticky header when the bottom of the main image row is near the top of the viewport
            setShowStickyHeader(rect.bottom < 150);
        }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateUrl = (newSlots: (ComparePerfume | null)[]) => {
    const ids = newSlots.filter(p => p !== null && p.id).map(p => p!.id);
    const params = new URLSearchParams();
    if (ids.length > 0) {
        params.set('ids', ids.join(','));
    }
    router.push(`/compare?${params.toString()}`);
  };

  const handleSelect = (index: number, perfume: unknown) => {
    // Cast the unknown input (from picker) to ComparePerfume. 
    // We assume the picker returns an object with at least id, name, etc.
    // The missing fields will be handled by the UI (loading/skeleton).
    const newSlots = [...slots];
    newSlots[index] = perfume as ComparePerfume; 
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
    if (newSlots.length === 0) {
        newSlots.push(null);
    }
    while (newSlots.length < 2) {
        newSlots.push(null);
    }
    setSlots(newSlots);
    updateUrl(newSlots);
  };

  // Helper Functions
  const checkOccasion = (p: ComparePerfume, occasion: string) => {
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

  const getNotes = (p: ComparePerfume, type: string): ComparePerfumeNote[] => {
    return p.perfume_notes?.filter((n) => n.type === type) || [];
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

  // Winner Logic
  const getWinners = () => {
    const activeSlots = slots.filter(s => s !== null) as ComparePerfume[];
    if (activeSlots.length < 2) return { price: [], longevity: [], sillage: [] };

    const winners = {
        price: [] as string[],
        longevity: [] as string[],
        sillage: [] as string[]
    };

    // Price: Lowest wins (fewer '$')
    let minPrice = Infinity;
    activeSlots.forEach(p => {
        if (!p.price_tier) return;
        const val = p.price_tier.length;
        if (val < minPrice) minPrice = val;
    });
    if (minPrice !== Infinity) {
        winners.price = activeSlots.filter(p => p.price_tier?.length === minPrice).map(p => p.id);
    }

    // Longevity: Highest wins
    let maxLong = -1;
    activeSlots.forEach(p => {
        if (p.longevity_rating === undefined) return;
        if (p.longevity_rating > maxLong) maxLong = p.longevity_rating;
    });
    if (maxLong !== -1) {
        winners.longevity = activeSlots.filter(p => p.longevity_rating === maxLong).map(p => p.id);
    }

    // Sillage: Highest wins
    let maxSillage = -1;
    activeSlots.forEach(p => {
        if (p.sillage_rating === undefined) return;
        if (p.sillage_rating > maxSillage) maxSillage = p.sillage_rating;
    });
    if (maxSillage !== -1) {
        winners.sillage = activeSlots.filter(p => p.sillage_rating === maxSillage).map(p => p.id);
    }

    return winners;
  };

  const winners = getWinners();

  // Skeleton Component
  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-stone-200 rounded ${className}`}></div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans pb-20 relative">
        
        {/* Main Header / Nav */}
        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-40 h-16">
            <Link href="/" className="text-xs font-semibold uppercase tracking-widest hover:opacity-60 transition">← Collection</Link>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Battle Analysis</span>
        </div>

        {/* STICKY COMPARISON HEADER (Visible on scroll) */}
        <div 
            className={`fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-stone-200 z-30 transition-transform duration-300 shadow-sm ${showStickyHeader ? 'translate-y-0' : '-translate-y-full'}`}
        >
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid gap-8 min-w-[600px] overflow-x-auto" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                    <div className="p-3 flex items-center text-[10px] font-bold uppercase tracking-widest text-stone-400">Perfume</div>
                    {slots.map((p, i) => (
                        <div key={i} className="p-3 flex items-center gap-3 border-l border-stone-100">
                            {p ? (
                                <>
                                    <div className="w-8 h-8 relative shrink-0 bg-stone-50 rounded-md border border-stone-100">
                                        {p.image_url ? (
                                            <Image src={p.image_url} alt={p.name} fill className="object-contain mix-blend-multiply p-1" sizes="32px" />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-bold uppercase text-stone-400 truncate leading-none mb-0.5">{p.brand?.name}</div>
                                        <div className="text-xs font-serif text-stone-900 truncate leading-none">{p.name}</div>
                                    </div>
                                </>
                            ) : (
                                <span className="text-[10px] text-stone-300 italic">Empty</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 mt-8">
            
            {/* 1. SELECTION BAR */}
            <div className="flex flex-col md:flex-row gap-4 items-start mb-12">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {slots.map((slot, index) => (
                        <div key={index} className="relative group/slot">
                            <PerfumePicker 
                                label={`Fighter ${index + 1}`} 
                                onSelect={(p) => handleSelect(index, p)} 
                                selected={slot} 
                                placeholder="Search perfume..."
                            />
                            {/* Remove Button */}
                            {(slots.length > 2 || (slots.length === 2 && slot !== null)) && (
                                <button 
                                    onClick={() => handleRemoveSlot(index)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-stone-100 border border-stone-200 rounded-full text-stone-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition z-20 opacity-0 group-hover/slot:opacity-100"
                                    title="Remove Slot"
                                >
                                    <X className="w-3 h-3" />
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
                                className="w-full h-[88px] bg-stone-50 border border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 hover:border-stone-400 hover:bg-stone-100 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest">Add Slot</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. COMPARISON TABLE */}
            {slots.some(s => s !== null) && (
                <div className="overflow-x-auto pb-20">
                    {/* HEADER ROW (Images) */}
                    <div ref={mainImageRowRef} className="grid gap-8 min-w-[600px]" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
                        {slots.map((p, i) => (
                            <div key={i} className="text-center">
                                {p ? (
                                    <>
                                        <div className="h-48 flex items-center justify-center mb-4 p-4 bg-white rounded-xl border border-stone-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                            {p.image_url ? (
                                                <div className="relative w-full h-full">
                                                    <Image 
                                                        src={p.image_url} 
                                                        alt={p.name}
                                                        fill
                                                        className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 100vw, 200px"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-stone-300 text-xs">No Image</span>
                                            )}
                                            {p.rating && (
                                                <div className="absolute top-2 right-2 bg-stone-900 text-white text-[9px] font-bold px-2 py-1 rounded">
                                                    {p.rating.toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate px-2">{p.brand?.name || <Skeleton className="h-2 w-16 mx-auto" />}</div>
                                        <Link href={`/perfume/${p.id}`} className="font-serif text-xl text-stone-900 hover:underline decoration-stone-300 underline-offset-4 line-clamp-2 h-14 block">
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
                            <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 flex items-center gap-2">
                                <Trophy className="w-3 h-3 text-stone-400" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Specifications</h3>
                            </div>
                            
                            {/* Price */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Price
                                </div>
                                {slots.map((p, i) => {
                                    const isWinner = p && winners.price.includes(p.id);
                                    return (
                                        <div key={i} className={`p-4 text-center font-mono text-sm border-l border-stone-100 flex items-center justify-center relative ${isWinner ? 'bg-stone-50 font-bold text-stone-900' : 'text-stone-600'}`}>
                                            {p ? (p.price_tier !== undefined ? (
                                                <>
                                                    {p.price_tier}
                                                    {isWinner && <span className="absolute bottom-1 text-[8px] font-sans font-bold bg-stone-900 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Best Value</span>}
                                                </>
                                            ) : <Skeleton className="h-4 w-8" />) : '-'}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Longevity */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Longevity
                                </div>
                                {slots.map((p, i) => {
                                    const isWinner = p && winners.longevity.includes(p.id);
                                    return (
                                        <div key={i} className={`p-4 text-center text-sm font-medium border-l border-stone-100 flex items-center justify-center relative ${isWinner ? 'bg-stone-50 text-stone-900' : 'text-stone-600'}`}>
                                            {p ? (p.longevity_rating !== undefined ? (
                                                <>
                                                    {ratingToDescription(p.longevity_rating)}
                                                    {isWinner && <span className="absolute bottom-1 right-2 text-stone-900 text-[10px]">★</span>}
                                                </>
                                            ) : <Skeleton className="h-4 w-20" />) : '-'}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sillage */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <Wind className="w-3 h-3" /> Sillage
                                </div>
                                {slots.map((p, i) => {
                                    const isWinner = p && winners.sillage.includes(p.id);
                                    return (
                                        <div key={i} className={`p-4 text-center border-l border-stone-100 relative ${isWinner ? 'bg-stone-50' : ''}`}>
                                            {p ? (
                                                p.sillage_rating !== undefined ? (
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span className={`text-xs font-medium mb-1 ${isWinner ? 'text-stone-900' : 'text-stone-600'}`}>{getSillageDescription(p.sillage_rating)}</span>
                                                        <div className="flex items-center justify-center gap-1">
                                                            {[1,2,3,4,5,6,7,8,9,10].map(star => (
                                                                <div key={star} className={`h-1.5 w-3 rounded-full ${star <= (p.sillage_rating || 0) ? (isWinner ? 'bg-stone-900' : 'bg-stone-400') : 'bg-stone-200'}`}></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : <div className="flex flex-col gap-1 items-center"><Skeleton className="h-3 w-16" /><Skeleton className="h-1.5 w-24" /></div>
                                            ) : '-'}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Gender */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center">Gender</div>
                                {slots.map((p, i) => (
                                    <div key={i} className="p-4 text-center text-sm text-stone-600 border-l border-stone-100 flex items-center justify-center">
                                        {p ? (p.gender || <Skeleton className="h-4 w-12" />) : '-'}
                                    </div>
                                ))}
                            </div>

                            {/* Seasonality */}
                            <div className="grid border-b border-stone-100 last:border-0 hover:bg-stone-50 transition" style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                                <div className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Seasons
                                </div>
                                {slots.map((p, i) => (
                                    <div key={i} className="p-4 text-center border-l border-stone-100 flex flex-wrap gap-1 justify-center content-center">
                                        {p ? (
                                            p.best_season && p.best_season.length > 0 ? (
                                                <>
                                                    {p.best_season.includes('Spring') && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-stone-600 border border-stone-200">SPRING</span>}
                                                    {p.best_season.includes('Summer') && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-stone-600 border border-stone-200">SUMMER</span>}
                                                    {p.best_season.includes('Autumn') && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-stone-600 border border-stone-200">AUTUMN</span>}
                                                    {p.best_season.includes('Winter') && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-stone-600 border border-stone-200">WINTER</span>}
                                                </>
                                            ) : <span className="text-stone-300 text-xs">-</span>
                                        ) : '-'}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SCENT PROFILE RADAR (Updated to Bars) */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-6">Olfactory DNA</h3>
                            {getProfileKeys().length > 0 ? getProfileKeys().map((key) => (
                                <div key={key} className="mb-6 last:mb-0">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900">{key}</span>
                                    </div>
                                    {/* Grid Background */}
                                    <div className="relative h-24 w-full bg-stone-50 rounded-lg border border-stone-100 flex items-end justify-between px-4 pb-0 overflow-hidden">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                            {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-stone-300"></div>)}
                                        </div>
                                        
                                        {/* Bars */}
                                        {slots.map((p, i) => {
                                            const val = p?.scent_profile?.[key] || 0;
                                            return (
                                                <div key={i} className="h-full flex flex-col justify-end items-center flex-1 mx-1 group relative">
                                                    {p && (
                                                        <>
                                                            <div 
                                                                className={`w-full max-w-[24px] min-w-[8px] rounded-t-sm transition-all duration-500 relative ${['bg-stone-800', 'bg-stone-400', 'bg-stone-600', 'bg-stone-300'][i % 4]}`} 
                                                                style={{ height: `${val * 10}%` }}
                                                            >
                                                                {/* Tooltip */}
                                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                    {p.name}: {val}/10
                                                                </div>
                                                            </div>
                                                            {/* Label at bottom */}
                                                            {/* <div className="mt-1 text-[8px] uppercase font-bold text-stone-400 truncate w-full text-center">{p.brand?.name}</div> */}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-stone-400 text-sm py-4">
                                    Select perfumes to compare scent profiles
                                </div>
                            )}
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
                                        if (!p) return <div key={i} className="p-4 text-center border-l border-stone-100"><span className="text-stone-200">·</span></div>;
                                        
                                        // If missing data (vibe_tags is key), show loading
                                        if (!p.vibe_tags && !p.occasions) return <div key={i} className="p-4 text-center border-l border-stone-100 flex justify-center"><Skeleton className="h-4 w-4 rounded-full" /></div>;

                                        const fits = checkOccasion(p, occasion);
                                        return (
                                            <div key={i} className="p-4 text-center border-l border-stone-100">
                                                {fits ? <span className="text-stone-900 font-bold">✓</span> : <span className="text-stone-200">·</span>}
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
                                                        {getNotes(p, type).map((n) => (
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