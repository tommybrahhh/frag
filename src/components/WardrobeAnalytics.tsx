'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function WardrobeAnalytics({ collection }: { collection: any[] }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [brandRecs, setBrandRecs] = useState<any[]>([]);
  const [missingSeason, setMissingSeason] = useState<string | null>(null);
  const [topBrand, setTopBrand] = useState<string | null>(null);

  // COLORS for Chart
  const COLORS = ['#1c1917', '#57534e', '#a8a29e', '#d6d3d1', '#e7e5e4'];

  // 1. ANALYZE COLLECTION
  const vibes: Record<string, number> = {};
  const seasons: Record<string, number> = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
  const brands: Record<string, number> = {};

  collection.forEach((item) => {
    // Vibes
    item.perfume.vibe_tags?.forEach((tag: string) => {
      vibes[tag] = (vibes[tag] || 0) + 1;
    });
    // Seasons (Check if array overlaps)
    item.perfume.best_season?.forEach((s: string) => {
      if (seasons[s] !== undefined) seasons[s]++;
    });
    // Brands
    const brandName = item.perfume.brand?.name;
    if (brandName) brands[brandName] = (brands[brandName] || 0) + 1;
  });

  // Prepare Chart Data
  const chartData = Object.entries(vibes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 2. INTELLIGENCE ENGINE (Run once on load)
  useEffect(() => {
    if (collection.length < 2) return;

    const runAnalysis = async () => {
      const supabase = createClient();
      const ownedIds = collection.map(c => c.perfume.id);

      // A. GAP ANALYSIS (Find missing season)
      const seasonsList = ['Winter', 'Summer', 'Fall', 'Spring'];
      const lowestSeason = seasonsList.reduce((a, b) => seasons[a] < seasons[b] ? a : b);
      
      if (seasons[lowestSeason] <= 1) { // If they have 0 or 1 scent for a season
        setMissingSeason(lowestSeason);
        // Fetch 3 recommendations for this season
        const { data: gapData } = await supabase
          .from('perfumes')
          .select('id, name, image_url, brand:brands(name)')
          .contains('best_season', [lowestSeason])
          .not('id', 'in', `(${ownedIds.join(',')})`) // Exclude owned
          .limit(3);
        
        if (gapData) setRecommendations(gapData);
      }

      // B. BRAND LOYALTY (Find favorite brand)
      const favoriteBrand = Object.keys(brands).reduce((a, b) => brands[a] > brands[b] ? a : b, '');
      if (favoriteBrand && brands[favoriteBrand] >= 2) { // Must own at least 2 to be "loyal"
        setTopBrand(favoriteBrand);
        // Fetch recommendations from this brand
        const { data: brandData } = await supabase
          .from('perfumes')
          .select('id, name, image_url, brand:brands!inner(name)') // !inner filters by brand name
          .eq('brand.name', favoriteBrand)
          .not('id', 'in', `(${ownedIds.join(',')})`)
          .limit(2);

        if (brandData) setBrandRecs(brandData);
      }
    };

    runAnalysis();
  }, [collection.length]); // Only run if collection size changes

  if (collection.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-12">
      
      {/* 1. VISUAL DNA (Donut Chart) */}
      <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6">Olfactory DNA</h4>
        <div className="flex items-center gap-8">
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1c1917' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-serif text-stone-300">{collection.length}</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="font-bold text-stone-700 uppercase tracking-wide">{entry.name}</span>
                </div>
                <span className="text-stone-400">{Math.round((entry.value / collection.length) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. INTELLIGENT INSIGHTS (Gap & Brand) */}
      <div className="space-y-6">
        
        {/* GAP ANALYSIS */}
        {missingSeason && recommendations.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">❄️</span>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Missing: {missingSeason} Scents</h4>
                <p className="text-xs text-stone-500">Your collection is low on {missingSeason} fragrances.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recommendations.map(p => (
                <Link key={p.id} href={`/perfume/${p.id}`} className="group text-center">
                  <div className="bg-stone-50 rounded-lg p-2 mb-2 group-hover:bg-stone-100 transition">
                    <img src={p.image_url} className="h-16 w-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="text-[9px] font-bold text-stone-400 uppercase truncate">{p.brand?.name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* BRAND LOYALTY */}
        {topBrand && brandRecs.length > 0 && (
          <div className="bg-stone-900 rounded-3xl p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold">House Loyalty: {topBrand}</h4>
                <p className="text-xs text-stone-400">Since you love {topBrand}, try these:</p>
              </div>
              <span className="text-xl">♛</span>
            </div>
            <div className="space-y-3">
              {brandRecs.map(p => (
                <Link key={p.id} href={`/perfume/${p.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition">
                    <img src={p.image_url} className="h-8 object-contain" />
                  </div>
                  <div className="flex-1 border-b border-white/10 pb-2 group-hover:border-white/30 transition">
                    <div className="text-xs font-serif">{p.name}</div>
                  </div>
                  <span className="text-xs text-stone-500 group-hover:text-white transition">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}