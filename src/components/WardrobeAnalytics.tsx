'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function WardrobeAnalytics({ collection }: { collection: any[] }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recTitle, setRecTitle] = useState('');
  const [recReason, setRecReason] = useState('');

  // COLORS
  const COLORS = ['#1c1917', '#57534e', '#a8a29e', '#d6d3d1', '#e7e5e4'];

  // 1. DATA PROCESSING
  const vibes: Record<string, number> = {};
  const seasons: Record<string, number> = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
  const brands: Record<string, number> = {};

  collection.forEach((item) => {
    item.perfume.vibe_tags?.forEach((tag: string) => vibes[tag] = (vibes[tag] || 0) + 1);
    item.perfume.best_season?.forEach((s: string) => { if (seasons[s] !== undefined) seasons[s]++ });
    if (item.perfume.brand?.name) brands[item.perfume.brand.name] = (brands[item.perfume.brand.name] || 0) + 1;
  });

  const topVibe = Object.entries(vibes).sort((a, b) => b[1] - a[1])[0]?.[0];
  const chartData = Object.entries(vibes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));

  // 2. INTELLIGENCE ENGINE
  useEffect(() => {
    if (collection.length < 1) return;

    const runAnalysis = async () => {
      const supabase = createClient();
      const ownedIds = collection.map(c => c.perfume.id);
      
      // STRATEGY 1: Brand Loyalty (If own 3+ from one house)
      const topBrandEntry = Object.entries(brands).sort((a, b) => b[1] - a[1])[0];
      if (topBrandEntry && topBrandEntry[1] >= 3) {
        const { data } = await supabase.from('perfumes').select('id, name, image_url, brand:brands!inner(name)').eq('brand.name', topBrandEntry[0]).not('id', 'in', `(${ownedIds.join(',')})`).limit(3);
        if (data && data.length > 0) {
          setRecommendations(data);
          setRecTitle(`More from ${topBrandEntry[0]}`);
          setRecReason(`You seem loyal to ${topBrandEntry[0]}. Complete the collection.`);
          return;
        }
      }

      // STRATEGY 2: Season Gap (If missing a season)
      const seasonsList = ['Winter', 'Summer', 'Fall', 'Spring'];
      const lowestSeason = seasonsList.reduce((a, b) => seasons[a] < seasons[b] ? a : b);
      if (seasons[lowestSeason] === 0) {
        const { data } = await supabase.from('perfumes').select('id, name, image_url, brand:brands(name)').contains('best_season', [lowestSeason]).not('id', 'in', `(${ownedIds.join(',')})`).limit(3);
        if (data && data.length > 0) {
          setRecommendations(data);
          setRecTitle(`Missing: ${lowestSeason}`);
          setRecReason(`Your collection lacks ${lowestSeason} scents. Try these:`);
          return;
        }
      }

      // STRATEGY 3: Vibe Match (Fallback - Always works)
      if (topVibe) {
        const { data } = await supabase.from('perfumes').select('id, name, image_url, brand:brands(name)').contains('vibe_tags', [topVibe]).not('id', 'in', `(${ownedIds.join(',')})`).limit(3);
        if (data) {
          setRecommendations(data);
          setRecTitle(`Based on "${topVibe}"`);
          setRecReason(`Since you enjoy ${topVibe} fragrances, you might love these:`);
        }
      }
    };

    runAnalysis();
  }, [collection.length]);

  if (collection.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4">
      {/* Chart */}
      <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6">Collection DNA</h4>
        <div className="flex items-center gap-8">
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-serif text-stone-300">{collection.length}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between text-xs">
                <span className="font-bold text-stone-700 uppercase">{entry.name}</span>
                <span className="text-stone-400">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-stone-900 rounded-3xl p-8 text-white flex flex-col justify-center">
        <div className="mb-6">
          <h4 className="text-xl font-serif mb-1">{recTitle || "Curated for You"}</h4>
          <p className="text-xs text-stone-400">{recReason || "Based on your taste profile."}</p>
        </div>
        <div className="space-y-4">
          {recommendations.map(p => (
            <Link key={p.id} href={`/perfume/${p.id}`} className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition">
                <img src={p.image_url} className="h-8 object-contain" />
              </div>
              <div className="flex-1 border-b border-white/10 pb-3 group-hover:border-white/30 transition">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{p.brand?.name}</div>
                <div className="text-sm font-serif">{p.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}