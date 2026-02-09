'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ActivityItem, CommunityStats } from '@/lib/services/communityService';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface CommunityHeroProps {
  activity: ActivityItem[];
  stats?: CommunityStats;
}

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

export default function CommunityHero({ activity, stats }: CommunityHeroProps) {
  return (
    <section className="relative w-full min-h-[600px] bg-stone-900 text-white overflow-hidden flex items-center">
      
      {/* 1. Subtle Background Layers */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover opacity-30 brightness-[0.7]"
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Warm editorial gradient that matches the fragrance/luxury theme */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
      </div>

      {/* 2. Abstract Lighting Accents (Matching content better) */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-stone-800/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 w-full pt-24 pb-16 lg:py-0 relative z-10">
        
        {/* Left: Content */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/80">The Scent Community</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-8">
              Where Every <br />
              <span className="italic text-stone-300">Scent Has a Story.</span>
            </h1>
            
            <p className="text-lg text-stone-300/80 mb-10 max-w-md font-light leading-relaxed">
              Explore thousands of honest reviews and daily discussions. Join the world’s most passionate fragrance circle.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link 
                href="/search"
                className="px-8 py-4 bg-white text-stone-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-all active:scale-95"
              >
                Explore Library
              </Link>
              <Link 
                href="/community"
                className="group px-8 py-4 bg-stone-800/50 backdrop-blur-md border border-white/10 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-stone-800/80 transition-all flex items-center gap-2"
              >
                <span>Community Feed</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Dynamic Stats Section */}
            {stats && (
              <div className="flex gap-8 md:gap-12 border-t border-white/10 pt-8">
                <div>
                   <div className="text-2xl md:text-3xl font-serif text-white">{formatNumber(stats.perfumes)}</div>
                   <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Fragrances</div>
                </div>
                <div>
                   <div className="text-2xl md:text-3xl font-serif text-white">{formatNumber(stats.brands)}</div>
                   <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Brands</div>
                </div>
                <div>
                   <div className="text-2xl md:text-3xl font-serif text-white">{formatNumber(stats.members)}</div>
                   <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Enthusiasts</div>
                </div>
                <div>
                   <div className="text-2xl md:text-3xl font-serif text-white">{formatNumber(stats.reviews)}</div>
                   <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Contributions</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Clean Activity Feed */}
        <div className="relative h-[500px] overflow-hidden">
            {/* Top/Bottom Fade Masks */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-stone-900 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-900 to-transparent z-20 pointer-events-none" />
            
            <div className="flex flex-col gap-4 animate-scroll-vertical-slow hover:pause-animation">
              {[...activity, ...activity].map((item, i) => (
                <ActivityCard key={`${item.id}-${i}`} item={item} />
              ))}
            </div>
        </div>

      </div>
    </section>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/[0.08] transition-all duration-300 group">
      <div className="flex items-start gap-5">
        {/* Perfume Thumbnail */}
        <div className="relative w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
          {item.perfume_image ? (
            <Image 
              src={item.perfume_image} 
              alt={item.perfume_name} 
              fill 
              className="object-contain p-1 mix-blend-multiply opacity-90"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full bg-stone-200" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-white/90 truncate">{item.user_name}</h4>
            <span className="text-[10px] text-white/30 whitespace-nowrap">{formatTimeAgo(item.created_at)}</span>
          </div>
          
          <div className="text-[10px] uppercase tracking-wider text-amber-500/60 font-bold mb-2">
            {item.type === 'review' ? 'Reviewed' : 'Commented'}
          </div>

          <div className="font-serif text-sm text-white mb-2 truncate group-hover:text-amber-200 transition-colors">
            {item.perfume_name}
          </div>

          {item.content && (
            <p className="text-xs text-stone-300/70 line-clamp-2 italic leading-relaxed">
              "{item.content}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
