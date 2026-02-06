'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Trophy, DollarSign, Clock, Wind, Calendar, Briefcase, Coffee, Sparkles, Music, Plane, Dumbbell, Moon, Heart, Sun, Snowflake, Leaf, Flower2 } from 'lucide-react';
import PerfumePicker from '@/components/features/perfume/PerfumePicker';
import ComparisonScentRadar from './ComparisonScentRadar';
import { ratingToDescription } from '@/lib/longevity-utils';

interface ComparePerfumeNote {
  type: string;
  note: {
    name: string;
    color_hex?: string;
    url?: string;
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
const OCCASION_ICONS: Record<string, React.ReactNode> = {
  'Date Night': <Moon className="w-4 h-4" />,
  'Office Safe': <Briefcase className="w-4 h-4" />,
  'Casual Daily': <Coffee className="w-4 h-4" />,
  'Formal Event': <Sparkles className="w-4 h-4" />,
  'Party / Club': <Music className="w-4 h-4" />,
  'Summer Vacation': <Plane className="w-4 h-4" />,
  'Gym / Sport': <Dumbbell className="w-4 h-4" />
};

const SEASON_ICONS: Record<string, React.ReactNode> = {
  'Spring': <Flower2 className="w-3.5 h-3.5" />,
  'Summer': <Sun className="w-3.5 h-3.5" />,
  'Autumn': <Leaf className="w-3.5 h-3.5" />,
  'Winter': <Snowflake className="w-3.5 h-3.5" />
};
const COLORS = ['#1c1917', '#d97706', '#059669', '#2563eb']; // Stone-900, Amber-600, Emerald-600, Blue-600

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
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans pb-20 relative selection:bg-[#1C1917] selection:text-[#FAFAF9]">
        
        {/* Main Header / Nav */}
        <div className="px-6 py-4 sticky top-0 bg-[#FAFAF9]/90 backdrop-blur-md z-40 flex justify-between items-center border-b border-[#E7E5E4]">
            <Link href="/" className="text-xs font-semibold uppercase tracking-widest text-[#57534E] hover:text-[#1C1917] transition-colors">← Collection</Link>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A29E]">Compare Analysis</span>
        </div>

        {/* STICKY COMPARISON HEADER (Visible on scroll) */}
        <div 
            className={`fixed top-16 left-0 right-0 bg-[#FAFAF9]/95 backdrop-blur-sm border-b border-[#E7E5E4] z-30 transition-transform duration-300 shadow-sm ${showStickyHeader ? 'translate-y-0' : '-translate-y-full'}`}
        >
            <div className="max-w-[1400px] mx-auto px-6">
                <div className={`grid gap-3 md:gap-8 overflow-x-auto ${slots.length > 2 ? 'min-w-[600px]' : 'w-full'}`} style={{ gridTemplateColumns: `100px repeat(${slots.length}, 1fr)` }}>
                    <div className="p-3 flex items-center text-[10px] font-bold uppercase tracking-widest text-stone-400">Perfume</div>
                    {slots.map((p, i) => (
                        <div key={i} className="p-3 flex items-center gap-3 border-l border-stone-100 relative">
                             {/* Color Indicator */}
                            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: p ? COLORS[i % COLORS.length] : 'transparent' }}></div>
                            
                            {p ? (
                                <>
                                    <div className="w-8 h-8 relative shrink-0 bg-transparent rounded-md">
                                        {p.image_url ? (
                                            <Image src={p.image_url} alt={p.name} fill className="object-contain mix-blend-multiply" sizes="32px" />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-bold uppercase text-stone-400 truncate leading-none mb-0.5">{p.brand?.name}</div>
                                        <div className="text-xs font-serif text-stone-900 truncate leading-none">{p.name}</div>
                                    </div>
                                </>
                            ) : (
                                <span className="text-[10px] text-stone-300 italic pl-3">Empty</span>
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
                            {/* Color Tag */}
                            <div className="absolute top-0 right-0 mt-1 mr-1 w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>

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
                    <div ref={mainImageRowRef} className={`grid gap-3 md:gap-8 ${slots.length > 2 ? 'min-w-[600px]' : 'w-full'}`} style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
                        {slots.map((p, i) => (
                            <div key={i} className="text-center">
                                {p ? (
                                    <>
                                        <div 
                                            className="h-1 w-16 mx-auto rounded-full mb-3" 
                                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                        />
                                        <div className="h-48 flex items-center justify-center mb-4 p-4 rounded-xl transition-all duration-300 hover:bg-stone-100 relative group">
                                            {p.image_url ? (
                                                <div className="relative w-full h-full">
                                                    <Image 
                                                        src={p.image_url} 
                                                        alt={p.name}
                                                        fill
                                                        className="object-contain mix-blend-multiply transition-transform duration-500"
                                                        sizes="(max-width: 768px) 100vw, 200px"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-stone-300 text-xs">No Image</span>
                                            )}
                                            {p.rating && (
                                                <div className="absolute top-2 right-2 bg-stone-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <div className="h-full flex flex-col justify-end">
                                        <div className="h-48 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 flex items-center justify-center text-stone-300 text-sm">
                                            Empty
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={`mt-12 space-y-12 ${slots.length > 2 ? 'min-w-[600px]' : 'w-full'}`}>
                        
                        {/* BASIC SPECS */}
                        <div className="grid gap-3 md:gap-6" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
                            {slots.map((p, i) => {
                                const isPriceWinner = p && winners.price.includes(p.id);
                                const isLongevityWinner = p && winners.longevity.includes(p.id);
                                const isSillageWinner = p && winners.sillage.includes(p.id);

                                return (
                                    <div key={i} className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-[0_30px_60px_rgba(0,0,0,0.05)] p-3 md:p-6 overflow-hidden relative">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-200">
                                            Specifications
                                        </div>
                                        
                                        {p ? (
                                            <div className="space-y-6">
                                                {/* Price */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                                            <DollarSign className="w-3 h-3" /> Price
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm font-bold text-stone-900">{p.price_tier || 'N/A'}</span>
                                                            {isPriceWinner && (
                                                                <span className="text-[8px] font-bold bg-stone-900 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Best Value</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Longevity */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                                            <Clock className="w-3 h-3" /> Longevity
                                                        </span>
                                                        <span className="text-[10px] font-serif italic text-stone-900 flex items-center gap-1">
                                                            {ratingToDescription(p.longevity_rating || 0)}
                                                            {isLongevityWinner && <Trophy className="w-2.5 h-2.5 text-stone-900" />}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 h-1.5">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
                                                            <div key={step} className={`flex-1 rounded-full ${(p.longevity_rating || 0) >= step ? 'bg-stone-800' : 'bg-stone-100'}`} />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Sillage */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                                                            <Wind className="w-3 h-3" /> Sillage
                                                        </span>
                                                        <span className="text-[10px] font-serif italic text-stone-900 flex items-center gap-1">
                                                            {getSillageDescription(p.sillage_rating)}
                                                            {isSillageWinner && <Trophy className="w-2.5 h-2.5 text-stone-900" />}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 h-1.5">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => (
                                                            <div key={step} className={`flex-1 rounded-full ${(p.sillage_rating || 0) >= step ? 'bg-stone-800' : 'bg-stone-100'}`} />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Gender */}
                                                <div className="pt-4 border-t border-stone-100">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Gender</span>
                                                        <span className="text-xs font-bold text-stone-900">{p.gender || 'Unisex'}</span>
                                                    </div>
                                                </div>

                                                {/* Seasons */}
                                                <div className="pt-4 border-t border-stone-100">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-3">Best Seasons</span>
                                                    <div className="flex gap-2 flex-wrap justify-center">
                                                        {['Spring', 'Summer', 'Autumn', 'Winter'].map(season => {
                                                            const active = p.best_season?.includes(season);
                                                            return (
                                                                <div 
                                                                    key={season} 
                                                                    title={season}
                                                                    className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full border transition-all ${
                                                                        active ? 'bg-stone-900 border-stone-900 text-white shadow-md' : 'bg-stone-50 border-stone-100 text-stone-300 opacity-40'
                                                                    }`}
                                                                >
                                                                    {SEASON_ICONS[season]}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="text-stone-300 text-xs italic">Empty Slot</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* SCENT PROFILE RADAR */}
                        <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-[0_30px_60px_rgba(0,0,0,0.05)] overflow-hidden p-6">
                            <h3 className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-200">
                                Olfactory DNA <span className="flex-1 h-px bg-stone-200"></span>
                            </h3>
                            <ComparisonScentRadar slots={slots} colors={COLORS} />
                        </div>

                        {/* OCCASIONS */}
                        <div className="grid gap-3 md:gap-6" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
                             {slots.map((p, i) => (
                                <div key={i} className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-[0_30px_60px_rgba(0,0,0,0.05)] p-3 md:p-6 overflow-hidden relative">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 pb-2 border-b border-stone-200">
                                        Occasions
                                    </div>
                                    <div className="space-y-3">
                                        {OCCASIONS.map((occasion) => {
                                            const fits = p ? checkOccasion(p, occasion) : false;
                                            return (
                                                <div 
                                                    key={occasion} 
                                                    className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border transition-all duration-300 ${
                                                        fits 
                                                            ? 'bg-white border-stone-100 shadow-sm text-stone-900' 
                                                            : 'bg-transparent border-transparent text-stone-300 opacity-50 grayscale'
                                                    }`}
                                                >
                                                    <div className={`p-1.5 md:p-2 rounded-full ${fits ? 'bg-stone-50 text-stone-900' : 'bg-stone-50/50 text-stone-300'}`}>
                                                        {OCCASION_ICONS[occasion] || <Heart className="w-4 h-4" />}
                                                    </div>
                                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">{occasion}</span>
                                                    {fits && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-900"></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {!p && (
                                         <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="text-stone-300 text-xs italic">Empty Slot</span>
                                         </div>
                                    )}
                                </div>
                             ))}
                        </div>

                        {/* NOTES */}
                        <div className="grid gap-3 md:gap-6" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
                            {slots.map((p, i) => (
                                <div key={i} className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-[0_30px_60px_rgba(0,0,0,0.05)] p-3 md:p-6 overflow-hidden relative min-h-[300px]">
                                    {p && (
                                        <div className="space-y-8">
                                            {['Top', 'Heart', 'Base'].map(type => {
                                                const notes = getNotes(p, type);
                                                if (notes.length === 0) return null;
                                                
                                                return (
                                                    <div key={type}>
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 border-b border-stone-200 pb-2">{type} Notes</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {notes.map((n) => (
                                                                <span key={n.note.name} className="inline-flex items-center gap-2 px-2 py-1.5 bg-stone-50/50 border border-stone-100 rounded-lg text-xs font-medium text-stone-700 shadow-sm hover:border-stone-200 transition-colors">
                                                                    {n.note.url ? (
                                                                        <div className="w-5 h-5 rounded-full bg-white border border-stone-100 overflow-hidden relative flex-shrink-0">
                                                                            <img src={n.note.url} alt={n.note.name} className="w-full h-full object-cover" />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="w-2 h-2 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: n.note.color_hex || '#e7e5e4' }}></span>
                                                                    )}
                                                                    <span className="pr-1">{n.note.name}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* Show empty state if perfume exists but has absolutely no notes */}
                                            {!p.perfume_notes?.length && (
                                                <div className="text-center py-10">
                                                    <span className="text-stone-300 text-xs italic">No notes data available</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {!p && (
                                         <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="text-stone-300 text-xs italic">Empty Slot</span>
                                         </div>
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