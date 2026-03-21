'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { getPerfumeImage } from '@/lib/perfume-utils';


type Perfume = {
  id: string;
  name: string;
  brands: { name: string } | null;
  slug: string | null;
  price_tier: string;
  image_url: string | null;
  vibe_tags: string[] | null;
  best_season: string[] | null;
  rating: number;
};

export default function AllRecommendationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('All');
  const [selectedVibe, setSelectedVibe] = useState<string>('All');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        if (user) {
          console.log('Fetching profile for user:', user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('vibe_tags, best_season')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }

          if (profile) {
            console.log('Profile data:', profile);
            const userProfile = profile as any;
            if (userProfile.vibe_tags && userProfile.vibe_tags.length > 0) {
               setSelectedVibe(userProfile.vibe_tags[0]);
            }
            if (userProfile.best_season) {
              setSelectedSeason(userProfile.best_season);
            }
          }
        }

        await fetchPerfumes();
      } catch (err) {
        console.error('Error initializing page:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user]);

  const fetchPerfumes = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('perfumes')
        .select(`
          id,
          name,
          price_tier,
          image_url,
          vibe_tags,
          best_season,
          rating,
          brands ( name )
        `);

      if (selectedSeason !== 'All') {
        query = query.contains('best_season', [selectedSeason]);
      }
      
      if (selectedVibe !== 'All') {
        query = query.contains('vibe_tags', [selectedVibe]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPerfumes((data as any) || []);
    } catch (err) {
      console.error('Error fetching perfumes:', err);
      setError('Failed to load perfumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchPerfumes();
    }
  }, [selectedSeason, selectedVibe]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] pb-24">
        <div className="max-w-5xl mx-auto px-6 pt-32">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-stone-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-stone-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 pb-24 font-sans">
      <div className="max-w-5xl mx-auto px-6 pt-32">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-serif">Your Scent Library</h1>
          <Link
            href="/profile"
            className="text-xs font-bold uppercase tracking-widest text-stone-900 hover:text-stone-600 transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-8 flex flex-wrap gap-4 items-center border border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5"
            >
              <option value="All">All</option>
              <option value="Winter">Winter</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Autumn">Autumn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Vibe</label>
            <select
              value={selectedVibe}
              onChange={(e) => setSelectedVibe(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
            >
              <option value="All">All Vibes</option>
              <option value="Romantic">Romantic</option>
              <option value="Fresh">Fresh</option>
              <option value="Dark">Dark</option>
              <option value="Elegant">Elegant</option>
              <option value="Cozy">Cozy</option>
            </select>
          </div>
          
          <button
            onClick={() => { setSelectedSeason('All'); setSelectedVibe('All'); }}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset
          </button>
        </div>

        {/* Perfume Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {perfumes.map((perfume) => (
            <div key={perfume.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex">
              <div className="w-1/3 bg-stone-50 flex items-center justify-center relative p-3">
                 {perfume.image_url ? (
                   <img src={getPerfumeImage(perfume.image_url)} alt={perfume.name} className="object-contain h-full w-full mix-blend-multiply" />
                 ) : (
                   <span className="text-4xl">🧴</span>
                 )}
              </div>
              
              <div className="p-4 flex flex-col justify-between w-2/3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{perfume.name}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-2">
                    {perfume.brands?.name || 'Unknown Brand'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {perfume.vibe_tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded uppercase font-bold tracking-wider">
                            {tag}
                        </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">{perfume.price_tier || 'N/A'}</span>
                  <Link href={`/perfume/${perfume.slug || perfume.id}`}>
                    <button className="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                        View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {perfumes.length === 0 && !loading && (
          <div className="text-center py-20 text-stone-400">
            No perfumes found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
}
