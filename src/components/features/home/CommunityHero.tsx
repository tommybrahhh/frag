'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ActivityItem, CommunityStats } from '@/lib/services/communityService';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { formatRelativeTime } from '@/utils/timeUtils';
import PerfumeImage from '@/components/ui/PerfumeImage';
import SearchBar from '@/components/features/search/SearchBar';

interface CommunityHeroProps {
  activity: ActivityItem[];
  stats?: CommunityStats;
}

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

export default function CommunityHero({ activity, stats }: CommunityHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative w-full min-h-[500px] lg:min-h-[600px] bg-white text-stone-900 overflow-hidden flex items-center border-b border-stone-100">
      
      {/* 1. Subtle Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[50%] bg-stone-50 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[20%] h-[40%] bg-stone-100 rounded-full blur-[80px] opacity-40" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 w-full pt-24 pb-16 lg:py-20 relative z-10">
        
        {/* Left: Content */}
        <div className="flex flex-col justify-center text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Scentia / The Circle</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-8 text-stone-900 tracking-tight">
              Find the scent that <br className="hidden md:block" />
              <span className="italic text-stone-400">tells your story.</span>
            </h1>
            
            <p className="text-base md:text-lg text-stone-500 mb-10 max-w-md mx-auto lg:mx-0 font-light leading-relaxed">
              Track what you wear, discover what you love, and share it with people who get it.
            </p>

            <SearchBar className="max-w-md mx-auto lg:mx-0 mb-8" />

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
              <Link 
                href="/search?sort=newest"
                className="w-full sm:w-auto px-10 py-4 bg-stone-900 text-stone-50 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
              >
                Explore library
              </Link>
              <Link 
                href="/community"
                className="w-full sm:w-auto px-10 py-4 bg-white border border-stone-200 text-stone-900 rounded-full font-bold text-[10px] uppercase tracking-widest hover:border-stone-900 transition-all flex items-center justify-center gap-2"
              >
                <span>The Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Dynamic Stats Section - More compact */}
            {stats && (
              <div className="flex justify-center lg:justify-start gap-12 pt-8 border-t border-stone-100">
                <div className="text-center lg:text-left">
                   <div className="text-2xl font-serif text-stone-900 mb-0.5">{formatNumber(stats.perfumes)}</div>
                   <div className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Scents</div>
                </div>
                <div className="text-center lg:text-left">
                   <div className="text-2xl font-serif text-stone-900 mb-0.5">{formatNumber(stats.members)}</div>
                   <div className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Members</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Activity Feed - More compact and subtle */}
        <div className="relative h-[500px] lg:h-[550px] overflow-hidden hidden md:block">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none" />
            
            <div className="flex flex-col gap-4 animate-scroll-vertical-slow hover:pause-animation">
              {[...activity, ...activity].map((item, i) => (
                <ActivityCard key={`${item.id}-${i}`} item={item} mounted={mounted} />
              ))}
            </div>
        </div>

      </div>
    </section>
  );
}

function ActivityCard({ item, mounted }: { item: ActivityItem; mounted: boolean }) {
  return (
    <div className="bg-white border border-stone-100 p-5 rounded-[2rem] hover:border-stone-300 hover:shadow-sm transition-all duration-500 group">
      <div className="flex items-center gap-5">
        {/* Perfume Thumbnail */}
        <div className="relative w-12 h-12 bg-stone-50 rounded-xl overflow-hidden flex-shrink-0 border border-stone-100">
          <PerfumeImage 
            src={item.perfume_image} 
            alt={item.perfume_name} 
            fill 
            className="object-contain p-2 mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-700"
            sizes="48px"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">{item.user_name}</h4>
            <span className="text-[9px] text-stone-300 font-medium">
              {mounted ? formatRelativeTime(item.created_at) : ''}
            </span>
          </div>
          
          <div className="font-serif text-sm text-stone-900 truncate group-hover:text-stone-600 transition-colors">
            {item.perfume_name}
          </div>
        </div>
      </div>
    </div>
  );
}
