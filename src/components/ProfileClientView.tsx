'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database } from '@/types/database';
import WardrobeAnalytics from '@/components/WardrobeAnalytics'; 
import { UserInsights, calculateScentDNA } from '@/lib/analytics'; 
import { Recommendation } from '@/lib/recommendation-engine';
import ProfileSettingsModal from './ProfileSettingsModal';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

type ProfilePageProps = {
  userEmail: string;
  displayName: string | null;
  bio: string | null;
  initialSignatureScentId?: string | null;
  initialCollection: (Tables<'perfumes'> & { brand: Tables<'brands'> | null, collection_id: string })[];
  insights: UserInsights;
  topMatches: Recommendation[];
  discoverySelections: Recommendation[];
};

// Visual Helper: Season Dots
const SeasonDots = ({ seasons }: { seasons: string[] | null }) => {
  if (!seasons || seasons.length === 0) return null;
  const map: Record<string, string> = { 
    Spring: 'bg-emerald-400', 
    Summer: 'bg-amber-400', 
    Fall: 'bg-orange-500', 
    Winter: 'bg-sky-500' 
  };
  return (
    <div className="flex gap-1" title={seasons.join(', ')}>
      {seasons.map(s => (
        <div key={s} className={`w-1.5 h-1.5 rounded-full ${map[s] || 'bg-gray-200'}`} />
      ))}
    </div>
  );
};

export default function ProfileClientView({ 
  userEmail, 
  displayName, 
  bio, 
  initialSignatureScentId,
  initialCollection = [], 
  insights, 
  topMatches = [], 
  discoverySelections = [] 
}: ProfilePageProps) {
  const { user, supabase, signOut } = useAuth();
  const [collection, setCollection] = useState(initialCollection || []);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // PROFILE SETTINGS STATE
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ displayName, bio, signatureScentId: initialSignatureScentId });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // VIEW & SORT STATE
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'wishlist' | 'reviews'>('wardrobe');
  const [viewMode, setViewMode] = useState<'grid' | 'season'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'brand'>('recent');
  
  // FILTER STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    families: string[];
    seasons: string[];
  }>({ families: [], seasons: [] });

  // 1. Calculate Real-time DNA 
  const dna = calculateScentDNA(collection);

  // 2. Derive Signature Scent Object
  const signatureScent = useMemo(() => {
    return collection.find(p => p.id === profileData.signatureScentId);
  }, [collection, profileData.signatureScentId]);

  // 3. Logic for "Current Rotation"
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };
  const currentSeason = getCurrentSeason();
  
  const rotationPicks = useMemo(() => {
      return collection.filter(p => 
        p.best_season?.includes(currentSeason) || 
        p.vibe_tags?.some((tag: string) => tag.toLowerCase().includes('dark') || tag.toLowerCase().includes('cozy'))
      ).slice(0, 3);
  }, [collection, currentSeason]);

  // Extract Filter Options
  const availableFamilies = useMemo(() => {
    const families = new Set<string>();
    collection.forEach(p => p.olfactory_family?.forEach(f => families.add(f)));
    return Array.from(families).sort();
  }, [collection]);

  const availableSeasons = ['Spring', 'Summer', 'Fall', 'Winter'];

  // Handle Remove from Collection
  const handleRemoveFromCollection = async (collectionItemId: string) => {
    if (!user || !supabase || !confirm('Are you sure you want to remove this fragrance from your wardrobe?')) return;

    setIsRemovingId(collectionItemId);
    setRemoveError(null);

    try {
      const { error: deleteError } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', collectionItemId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setCollection(currentCollection => currentCollection.filter(item => item.collection_id !== collectionItemId));
    } catch (err: any) {
      console.error('Error removing from collection:', err);
      setRemoveError(err.message || 'Failed to remove fragrance. Please try again.');
    } finally {
      setIsRemovingId(null);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (newDisplayName: string, newBio: string, newSignatureScentId: string | null) => {
    if (!user || !supabase) return;
    setIsSavingProfile(true);
    setSaveProfileError(null);
    setSaveProfileSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: newDisplayName, 
          bio: newBio,
          signature_scent_id: newSignatureScentId 
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfileData({ 
        displayName: newDisplayName, 
        bio: newBio, 
        signatureScentId: newSignatureScentId 
      });
      setSaveProfileSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveProfileSuccess(false);
      }, 1000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setSaveProfileError(err.message || 'Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredCollection = useMemo(() => {
    return collection.filter(p => {
      // 1. Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand?.name.toLowerCase().includes(q);
        if (!matchName && !matchBrand) return false;
      }

      // 2. Families (OR logic within families)
      if (activeFilters.families.length > 0) {
        const hasFamily = p.olfactory_family?.some(f => activeFilters.families.includes(f));
        if (!hasFamily) return false;
      }

      // 3. Seasons (OR logic within seasons)
      if (activeFilters.seasons.length > 0) {
        const hasSeason = p.best_season?.some(s => activeFilters.seasons.includes(s));
        if (!hasSeason) return false;
      }

      return true;
    });
  }, [collection, searchQuery, activeFilters]);

  // --- SORTING & GROUPING LOGIC ---
  const sortedCollection = useMemo(() => {
    let sorted = [...filteredCollection];
    if (sortBy === 'brand') {
      sorted.sort((a, b) => (a.brand?.name || '').localeCompare(b.brand?.name || ''));
    }
    // 'recent' assumes the API returns in insertion order or we could sort by collection_id desc if needed
    return sorted;
  }, [filteredCollection, sortBy]);

  const sections = useMemo<[string, typeof collection][]>(() => {
    if (viewMode === 'season') {
        const groups: Record<string, typeof collection> = { Spring: [], Summer: [], Fall: [], Winter: [] };
        sortedCollection.forEach(p => {
            if (p.best_season && Array.isArray(p.best_season)) {
                p.best_season.forEach(s => {
                    if (groups[s]) groups[s].push(p);
                });
            }
        });
        return Object.entries(groups).filter(([_, items]) => items.length > 0) as [string, typeof collection][];
    }
    return [['All', sortedCollection]];
  }, [sortedCollection, viewMode]);


  // Helper to toggle filters
  const toggleFilter = (type: 'families' | 'seasons', value: string) => {
    setActiveFilters(prev => {
      const current = prev[type];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: next };
    });
  };

  // Reusable Perfume Card Component
  const PerfumeCard = ({ perfume }: { perfume: typeof collection[0] }) => (
    <div className="group relative bg-white rounded-xl border border-stone-100 p-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
      {/* Remove Button */}
      <button
        onClick={() => handleRemoveFromCollection(perfume.collection_id)}
        disabled={isRemovingId === perfume.collection_id}
        className="absolute top-2 right-2 p-1 bg-white rounded-full text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Remove"
      >
        {isRemovingId === perfume.collection_id ? (
          <span className="animate-spin block h-3 w-3 border-2 border-stone-300 border-t-stone-600 rounded-full"/>
        ) : '✕'}
      </button>

      <Link href={`/perfume/${perfume.id}`} className="flex-1 flex flex-col">
        {/* Image Area */}
        <div className="h-40 flex items-center justify-center p-4 mb-3 bg-stone-50 rounded-lg group-hover:bg-white transition-colors relative">
            {perfume.image_url ? (
                <img src={perfume.image_url} alt={perfume.name} className="h-full object-contain mix-blend-multiply" />
            ) : (
                <span className="text-stone-300 text-xs italic">No Image</span>
            )}
        </div>

        {/* Content Area */}
        <div className="text-center mt-auto">
          <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
            {perfume.brand?.name}
          </div>
          <div className="font-serif text-base text-stone-900 leading-tight truncate mb-2">
            {perfume.name}
          </div>
          
          {/* Metadata Footer */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-stone-50">
             <SeasonDots seasons={perfume.best_season} />
             {/* Could add longevity or sillage icons here too */}
          </div>
        </div>
      </Link>
    </div>
  );


  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans pb-20">
      
      {/* Header Section */}
      <div className="bg-white border-b border-stone-200 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                 <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Member Profile</span>
                 <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                 <span className="text-xs font-bold text-stone-400">Est. {new Date().getFullYear()}</span>
            </div>
            
            <h1 className="text-4xl font-serif text-stone-900 mb-2">
                {profileData.displayName || userEmail?.split('@')[0]}
            </h1>
            
            {profileData.bio ? (
                 <p className="text-stone-500 max-w-lg mb-4">{profileData.bio}</p>
            ) : (
                 <p className="text-stone-400 italic text-sm mb-4">No bio yet. Tell us about your scent journey.</p>
            )}

            {/* Signature Scent Badge */}
            {signatureScent && (
                <Link href={`/perfume/${signatureScent.id}`} className="inline-flex items-center gap-3 bg-stone-50 border border-stone-200 pr-4 rounded-full hover:border-stone-400 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center overflow-hidden">
                        {signatureScent.image_url ? (
                            <img src={signatureScent.image_url} className="w-8 h-8 object-contain" alt="" />
                        ) : (
                            <span className="text-xs">🧴</span>
                        )}
                    </div>
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Signature Scent</div>
                        <div className="text-sm font-serif text-stone-900">{signatureScent.name}</div>
                    </div>
                </Link>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-3">
             <div className="flex gap-2">
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 bg-white border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-50 hover:text-stone-900 transition"
                >
                    Edit Profile
                </button>
                <button
                    onClick={signOut}
                    className="px-4 py-2 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-700 transition"
                >
                    Sign Out
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-stone-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-8">
                <button 
                    onClick={() => setActiveTab('wardrobe')}
                    className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'wardrobe' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                    Wardrobe ({collection.length})
                </button>
                <button 
                    onClick={() => setActiveTab('wishlist')}
                    className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'wishlist' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                    Wishlist (0)
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                    Reviews (0)
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        
        {/* Tab Content */}
        {activeTab === 'wardrobe' && (
            <div className="animate-in fade-in duration-300">
                {/* Analytics Section */}
                <WardrobeAnalytics 
                  insights={insights} 
                  dna={dna} 
                  rotationPicks={rotationPicks} 
                  currentSeason={currentSeason}
                />

                {/* Collection Manager Toolbar */}
                <div className="bg-[#FDFBF7]/95 pt-4 pb-2 mb-6 border-b border-stone-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-baseline gap-3">
                            <h2 className="font-serif text-2xl text-stone-900">All Fragrances</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search Input */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Find in wardrobe..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white border border-stone-200 text-sm rounded-lg pl-3 pr-8 py-2 w-48 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
                                />
                                {searchQuery ? (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs">✕</button>
                                ) : (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">🔍</span>
                                )}
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg border transition-colors ${showFilters || (activeFilters.families.length + activeFilters.seasons.length > 0) ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'}`}
                                title="Filters"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </button>

                            {/* View Toggle */}
                            <div className="flex bg-stone-200 rounded-lg p-1">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition ${viewMode === 'grid' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    Grid
                                </button>
                                <button 
                                    onClick={() => setViewMode('season')}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition ${viewMode === 'season' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    Season
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-white border border-stone-200 text-stone-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-stone-400"
                            >
                                <option value="recent">Recently Added</option>
                                <option value="brand">Brand (A-Z)</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Expanded Filters Panel */}
                    {showFilters && (
                        <div className="bg-stone-50 border-t border-stone-100 py-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-col gap-4">
                                {/* Family Filter */}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Olfactory Families</span>
                                    <div className="flex flex-wrap gap-2">
                                        {availableFamilies.map(f => (
                                            <button
                                                key={f}
                                                onClick={() => toggleFilter('families', f)}
                                                className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                                                    activeFilters.families.includes(f)
                                                        ? 'bg-stone-900 text-white border-stone-900'
                                                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                                }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                        {availableFamilies.length === 0 && <span className="text-stone-400 text-xs italic">No families found</span>}
                                    </div>
                                </div>
                                {/* Season Filter */}
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">Best Season</span>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSeasons.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => toggleFilter('seasons', s)}
                                                className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                                                    activeFilters.seasons.includes(s)
                                                        ? 'bg-stone-900 text-white border-stone-900'
                                                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Filters Summary */}
                    {(activeFilters.families.length > 0 || activeFilters.seasons.length > 0) && !showFilters && (
                        <div className="flex flex-wrap gap-2 pt-2 pb-2">
                            {activeFilters.families.map(f => (
                                <span key={f} className="bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                    {f}
                                    <button onClick={() => toggleFilter('families', f)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                            {activeFilters.seasons.map(s => (
                                <span key={s} className="bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                    {s}
                                    <button onClick={() => toggleFilter('seasons', s)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                            <button 
                                onClick={() => setActiveFilters({ families: [], seasons: [] })}
                                className="text-[10px] text-stone-400 hover:text-stone-600 underline"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {removeError && (
                        <div className="mt-2 text-red-500 text-xs p-2 bg-red-50 border border-red-200 rounded-lg">
                            {removeError}
                        </div>
                    )}
                </div>

                {/* Collection Content */}
                {filteredCollection.length > 0 ? (
                  <div className="space-y-12 mb-24">
                    {sections.map(([sectionTitle, items]) => (
                        <div key={sectionTitle}>
                            {viewMode !== 'grid' && (
                                <h3 className="text-lg font-serif text-stone-900 mb-4 pl-1 border-l-4 border-stone-200">
                                    {sectionTitle} <span className="text-stone-400 text-sm font-sans font-normal ml-2">({items.length})</span>
                                </h3>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {items.map(perfume => (
                                    <PerfumeCard key={`${perfume.id}-${sectionTitle}`} perfume={perfume} />
                                ))}
                            </div>
                        </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300 mb-24">
                    <h3 className="font-serif text-xl text-stone-400 mb-4">No matching fragrances</h3>
                    <p className="text-stone-500 mb-6 max-w-md mx-auto">Try adjusting your filters or search terms.</p>
                    <button 
                        onClick={() => { setSearchQuery(''); setActiveFilters({ families: [], seasons: [] }); }}
                        className="px-6 py-3 bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-200 transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
            </div>
        )}

        {/* Placeholders for Future Features */}
        {activeTab === 'wishlist' && (
            <div className="py-20 text-center animate-in fade-in duration-300">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-serif text-xl text-stone-900 mb-2">Wishlist Coming Soon</h3>
                <p className="text-stone-500">Keep track of the fragrances you want to try next.</p>
            </div>
        )}

        {activeTab === 'reviews' && (
            <div className="py-20 text-center animate-in fade-in duration-300">
                 <div className="text-4xl mb-4">✍️</div>
                <h3 className="font-serif text-xl text-stone-900 mb-2">My Reviews</h3>
                <p className="text-stone-500">See all your past reviews and ratings in one place.</p>
            </div>
        )}

        {/* Perfect Matches Section (Fixed Tier) */}
        {topMatches.length > 0 && activeTab === 'wardrobe' && (
          <div className="pt-12 border-t border-stone-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Curated For You</span>
                <h2 className="font-serif text-2xl text-stone-900 mt-1">Perfect Matches</h2>
                <p className="text-stone-500 text-sm mt-1">Highly compatible with your taste profile.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {topMatches.map((rec) => (
                <Link 
                  key={rec.perfume.id} 
                  href={`/perfume/${rec.perfume.id}`}
                  className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-48 flex items-center justify-center p-4 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors relative">
                    <div className="absolute top-2 right-2 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {rec.score}% Match
                    </div>
                    {rec.perfume.image_url ? (
                      <img src={rec.perfume.image_url} alt={rec.perfume.name} className="h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <span className="text-stone-300 text-xs italic">No Image</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
                      {rec.perfume.brand?.name}
                    </div>
                    <div className="font-serif text-lg text-stone-900 leading-tight truncate mb-2">
                      {rec.perfume.name}
                    </div>
                    <div className="text-xs text-stone-500 line-clamp-2 h-8 px-2">
                      {rec.reason}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Discovery Section (Shuffled Tier) */}
        {discoverySelections.length > 0 && activeTab === 'wardrobe' && (
          <div className="pt-12 border-t border-stone-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Explore</span>
                <h2 className="font-serif text-2xl text-stone-900 mt-1">Discover Something New</h2>
                <p className="text-stone-500 text-sm mt-1">Intriguing scents that expand your horizons.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {discoverySelections.map((rec) => (
                <div 
                  key={rec.perfume.id} 
                  className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <Link href={`/perfume/${rec.perfume.id}`} className="block flex-1">
                    <div className="h-48 flex items-center justify-center p-4 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors">
                      {rec.perfume.image_url ? (
                        <img src={rec.perfume.image_url} alt={rec.perfume.name} className="h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <span className="text-stone-300 text-xs italic">No Image</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
                        {rec.perfume.brand?.name}
                      </div>
                      <div className="font-serif text-lg text-stone-900 leading-tight truncate mb-2">
                        {rec.perfume.name}
                      </div>
                      <div className="text-xs text-stone-500 line-clamp-2 h-8 px-2 italic">
                        {rec.reason}
                      </div>
                    </div>
                  </Link>

                  {/* Vibe Chips */}
                  {rec.sharedVibes && rec.sharedVibes.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mt-3 px-2 pt-2 border-t border-stone-50">
                      {rec.sharedVibes.map((vibe) => (
                        <Link
                          key={vibe}
                          href={`/search?vibe=${encodeURIComponent(vibe)}`}
                          className="text-[9px] uppercase tracking-widest px-2 py-1 bg-stone-50 text-stone-400 rounded-full hover:bg-stone-200 hover:text-stone-600 transition-colors z-10 relative"
                        >
                          {vibe}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        initialDisplayName={profileData.displayName}
        initialBio={profileData.bio}
        initialSignatureScentId={profileData.signatureScentId}
        collection={collection}
        isSaving={isSavingProfile}
        saveError={saveProfileError}
        saveSuccess={saveProfileSuccess}
      />
    </div>
  );
}
