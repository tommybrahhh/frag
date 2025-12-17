'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database } from '@/types/database';
import WardrobeAnalytics from '@/components/WardrobeAnalytics'; // Import Analytics
import { UserInsights } from '@/lib/analytics'; // Import Types
import { Recommendation } from '@/lib/recommendation-engine';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

type ProfilePageProps = {
  userEmail: string;
  displayName: string | null;
  bio: string | null;
  initialCollection: (Tables<'perfumes'> & { brand: Tables<'brands'> | null, collection_id: string })[];
  insights: UserInsights;
  topMatches: Recommendation[];
  discoverySelections: Recommendation[];
};

export default function ProfileClientView({ 
  userEmail, 
  displayName, 
  bio, 
  initialCollection = [], 
  insights, 
  topMatches = [], 
  discoverySelections = [] 
}: ProfilePageProps) {
  const { user, supabase, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [collection, setCollection] = useState(initialCollection || []);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Handle Remove from Collection
  const handleRemoveFromCollection = async (collectionItemId: string) => {
    if (!user || !confirm('Are you sure you want to remove this fragrance from your wardrobe?')) return;

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

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans pb-20">
      
      {/* Header Section */}
      <div className="bg-white border-b border-stone-200 px-6 py-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Member Profile</span>
            <h1 className="text-4xl font-serif text-stone-900 mt-2 mb-2">My Wardrobe</h1>
            <p className="text-stone-500">{displayName || userEmail}</p>
            {bio && <p className="text-sm text-stone-400 mt-2 max-w-md">{bio}</p>}
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-200 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* Analytics Section */}
        <WardrobeAnalytics insights={insights} />

        {/* Collection Grid */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl text-stone-900">Saved Collection</h2>
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{collection.length} Bottles</span>
        </div>
        {removeError && (
          <div className="text-red-500 text-xs mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            {removeError}
          </div>
        )}

        {collection.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-24">
            {collection.map((perfume) => (
              <div 
                key={perfume.id} 
                className="group relative bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFromCollection(perfume.collection_id)}
                  disabled={isRemovingId === perfume.collection_id}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove from Wardrobe"
                >
                  {isRemovingId === perfume.collection_id ? (
                    <svg className="animate-spin h-4 w-4 text-stone-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '✕'
                  )}
                </button>

                <Link 
                  href={`/perfume/${perfume.id}`}
                  className={isRemovingId === perfume.collection_id ? 'pointer-events-none' : ''}
                >
                  <div className="h-48 flex items-center justify-center p-4 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors">
                    {perfume.image_url ? (
                      <img src={perfume.image_url} alt={perfume.name} className="h-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-stone-300 text-xs italic">No Image</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
                      {perfume.brand?.name}
                    </div>
                    <div className="font-serif text-lg text-stone-900 leading-tight truncate">
                      {perfume.name}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300 mb-24">
            <h3 className="font-serif text-xl text-stone-400 mb-4">Your shelf is empty</h3>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">Start exploring scents and save your favorites to build your digital wardrobe.</p>
            <Link href="/" className="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-700 transition">
              Explore Perfumes
            </Link>
          </div>
        )}

        {/* Perfect Matches Section (Fixed Tier) */}
        {topMatches.length > 0 && (
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
        {discoverySelections.length > 0 && (
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
                <Link 
                  key={rec.perfume.id} 
                  href={`/perfume/${rec.perfume.id}`}
                  className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
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
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
