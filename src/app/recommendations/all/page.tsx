'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import RecommendationsList from '@/components/RecommendationsList';
import Link from 'next/link';

export default function AllRecommendationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('vibe_tags, best_season')
          .eq('id', user.id)
          .single();

        setProfile(data);
        setLoading(false);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load recommendations');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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
          <h1 className="text-4xl font-serif">Your Personalized Recommendations</h1>
          <Link 
            href="/profile"
            className="text-xs font-bold uppercase tracking-widest text-stone-900 hover:text-stone-600 transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>

        {profile ? (
          <RecommendationsList 
            vibeTags={profile.vibe_tags || []}
            bestSeason={profile.best_season || 'all'}
          />
        ) : (
          <div className="text-center py-20 text-stone-400">
            Complete your profile to get personalized recommendations
          </div>
        )}
      </div>
    </div>
  );
}