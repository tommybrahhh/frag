'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function WardrobeAnalytics({ collection }: { collection: any[] }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recTitle, setRecTitle] = useState('');
  const [recReason, setRecReason] = useState('');
  const [secondaryRecommendations, setSecondaryRecommendations] = useState<any[]>([]);
  const [secondaryTitle, setSecondaryTitle] = useState('');
  const [secondaryReason, setSecondaryReason] = useState('');

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
        const { data } = await supabase.from('perfumes').select('id, name, image_url, brand:brands!inner(name)').eq('brand.name', topBrandEntry[0]).not('id', 'in', `(${ownedIds.join(',')})`).limit(6);
        if (data && data.length > 0) {
          setRecommendations(data);
          setRecTitle(`More from ${topBrandEntry[0]}`);
          setRecReason(`You seem loyal to ${topBrandEntry[0]}. Complete the collection.`);
          // Also fetch secondary recommendations based on top vibe
          if (topVibe) {
            const { data: secondaryData } = await supabase.from('perfumes').select('id, name, image_url, brand:brands(name)').contains('vibe_tags', [topVibe]).not('id', 'in', `(${ownedIds.join(',')})`).limit(6);
            if (secondaryData) {
              setSecondaryRecommendations(secondaryData);
              setSecondaryTitle(`Also try: ${topVibe}`);
              setSecondaryReason(`Explore more ${topVibe} fragrances`);
            }
          }
          return;
        }
      }

      // STRATEGY 2: Season Gap (If missing a season)
      const seasonsList = ['Winter', 'Summer', 'Fall', 'Spring'];
      const lowestSeason = seasonsList.reduce((a, b) => seasons[a] < seasons[b] ? a : b);
      if (seasons[lowestSeason] === 0) {
        const { data } = await supabase.from('perfumes').select('id, name, image_url, brand:brands(name)').contains('best_season', [lowestSeason]).not('id', 'in', `(${ownedIds.join(',')})`).limit(6);
        if (data && data.length > 0) {
          setRecommendations(data);
          setRecTitle(`Missing: ${lowestSeason}`);
          setRecReason(`Your collection lacks ${lowestSeason} scents. Try these:`);
          // Also fetch secondary recommendations based on brand loyalty if any
          const secondBrandEntry = Object.entries(brands).sort((a, b) => b[1] - a[1])[1];
          if (secondBrandEntry && secondBrandEntry[1] >= 2) {
            const { data: secondaryData } = await supabase.from('perfumes').select('id, name, image_url, brand:brands!inner(name)').eq('brand.name', secondBrandEntry[0]).not('id', 'in', `(${ownedIds.join(',')})`).limit(6);
            if (secondaryData) {
              setSecondaryRecommendations(secondaryData);
              setSecondaryTitle(`Also from ${secondBrandEntry[0]}`);
              setSecondaryReason(`Other scents from this house`);
            }
          }
          return;
        }
      }

      // STRATEGY 3: Vibe Match (Fallback - Always works)
      if (topVibe) {
        const { data } = await supabase.from('perfumes').select('id, name, image_url, brand:brands(name)').contains('vibe_tags', [topVibe]).not('id', 'in', `(${ownedIds.join(',')})`).limit(6);
        if (data) {
          setRecommendations(data);
          setRecTitle(`Based on "${topVibe}"`);
          setRecReason(`Since you enjoy ${topVibe} fragrances, you might love these:`);
          // Also fetch secondary recommendations based on second top vibe
          const secondVibe = Object.entries(vibes).sort((a, b) => b[1] - a[1])[1]?.[0];
          if (secondVibe) {
            const { data: secondaryData } = await supabase.from('perfumes').select('id, name, image_url, brand:brands(name)').contains('vibe_tags', [secondVibe]).not('id', 'in', `(${ownedIds.join(',')})`).limit(6);
            if (secondaryData) {
              setSecondaryRecommendations(secondaryData);
              setSecondaryTitle(`Also try: ${secondVibe}`);
              setSecondaryReason(`Explore another vibe you like`);
            }
          }
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
      <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm flex flex-col justify-center">
        <div className="mb-6">
          <h4 className="text-xl font-serif mb-1 text-stone-900">{recTitle || "Curated for You"}</h4>
          <p className="text-xs text-stone-500">{recReason || "Based on your taste profile."}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {recommendations.slice(0, 6).map(p => (
            <Link key={p.id} href={`/perfume/${p.id}`} className="flex items-center gap-3 group p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition">
              <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center group-hover:bg-stone-300 transition">
                <img src={p.image_url} className="h-6 object-contain" alt={p.name} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase font-bold text-stone-500 tracking-widest truncate">{p.brand?.name}</div>
                <div className="text-sm font-serif text-stone-900 truncate">{p.name}</div>
              </div>
            </Link>
          ))}
        </div>
        {secondaryRecommendations.length > 0 && (
          <>
            <div className="mt-8 pt-6 border-t border-stone-200">
              <h5 className="text-lg font-serif mb-2 text-stone-900">{secondaryTitle}</h5>
              <p className="text-xs text-stone-500 mb-4">{secondaryReason}</p>
              <div className="grid grid-cols-2 gap-3">
                {secondaryRecommendations.slice(0, 4).map(p => (
                  <Link key={p.id} href={`/perfume/${p.id}`} className="flex items-center gap-2 group p-2 rounded-lg bg-stone-50 hover:bg-stone-100 transition">
                    <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center">
                      <img src={p.image_url} className="h-5 object-contain" alt={p.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] uppercase font-bold text-stone-500 tracking-widest truncate">{p.brand?.name}</div>
                      <div className="text-xs font-serif text-stone-900 truncate">{p.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="mt-6 pt-4 border-t border-stone-200">
          <Link href="/" className="text-xs text-stone-500 hover:text-stone-900 flex items-center justify-center gap-1">
            <span>View all recommendations</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}