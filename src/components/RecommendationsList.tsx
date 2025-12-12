'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { SkeletonCard } from '@/components/SkeletonLoader';

interface RecommendationsListProps {
  vibeTags: string[];
  bestSeason: string;
}

export default function RecommendationsList({ vibeTags, bestSeason }: RecommendationsListProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          id,
          name,
          image_url,
          brand:brands(name),
          reason
        `)
        .contains('vibe_tags', vibeTags)
        .eq('best_season', bestSeason)
        .limit(8);

      if (!error && data) {
        setRecommendations(data);
      }
      setLoading(false);
    };

    fetchRecommendations();
  }, [user, vibeTags, bestSeason]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {recommendations.map((rec) => (
        <Link
          key={rec.id}
          href={`/perfume/${rec.id}`}
          className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="h-40 flex items-center justify-center p-2 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors">
            <img src={rec.image_url} className="h-full object-contain mix-blend-multiply" />
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate">
              {rec.brand?.name}
            </div>
            <div className="font-serif text-sm text-stone-900 truncate">{rec.name}</div>
            <div className="text-xs text-stone-500 mt-1 line-clamp-2">{rec.reason}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}