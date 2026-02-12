'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ActivityItem, CommunityStats } from '@/lib/services/communityService';
import { ArrowRight, MessageCircle, Search as SearchIcon } from 'lucide-react';

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
    <section className="relative w-full min-h-[700px] bg-white text-stone-900 overflow-hidden flex items-center border-b border-stone-100">
      
      {/* 1. Subtle Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-stone-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[50%] bg-stone-100 rounded-full blur-[100px] opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-px h-1/2 bg-gradient-to-b from-transparent via-stone-200 to-transparent" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 w-full pt-20 pb-16 lg:py-0 relative z-10">
        
        {/* Left: Content */}
        <div className="flex flex-col justify-center text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-stone-900" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">The Scent Community</span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl lg:text-8xl leading-tight mb-8 text-stone-900">
              Every Scent <br className="hidden md:block" />
              <span className="italic text-stone-400">Tells a Story.</span>
            </h1>
            
            <p className="text-base md:text-xl text-stone-600 mb-10 max-w-md mx-auto lg:mx-0 font-light leading-relaxed">
              Join thousands of enthusiasts sharing honest reviews and daily discoveries.
            </p>

            <div className="relative max-w-md mx-auto lg:mx-0 mb-8 group">
              <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
              <input 
                type="text" 
                placeholder="Find your next scent..."
                className="w-full pl-14 pr-6 py-4 md:py-5 bg-stone-50 border border-stone-100 rounded-2xl text-sm md:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-stone-900/5 focus:bg-white focus:border-stone-900 transition-all shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value)}`;
                  }
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
              <Link 
                href="/community"
                className="w-full sm:w-auto px-10 py-4 bg-stone-900 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-200"
              >
                Join Discussion
              </Link>
              <Link 
                href="/search"
                className="w-full sm:w-auto px-10 py-4 bg-white border border-stone-200 text-stone-900 rounded-full font-bold text-[10px] uppercase tracking-widest hover:border-stone-900 transition-all flex items-center justify-center gap-2"
              >
                <span>Browse</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Dynamic Stats Section - Compact on Mobile */}
            {stats && (
              <div className="flex justify-center lg:justify-start gap-8 md:gap-16 pt-8 border-t border-stone-100">
                <div className="text-center lg:text-left">
                   <div className="text-xl md:text-3xl font-serif text-stone-900 mb-0.5">{formatNumber(stats.perfumes)}</div>
                   <div className="text-[8px] md:text-[9px] uppercase tracking-widest text-stone-400 font-bold">Fragrances</div>
                </div>
                <div className="text-center lg:text-left">
                   <div className="text-xl md:text-3xl font-serif text-stone-900 mb-0.5">{formatNumber(stats.members)}</div>
                   <div className="text-[8px] md:text-[9px] uppercase tracking-widest text-stone-400 font-bold">Members</div>
                </div>
                <div className="text-center lg:text-left">
                   <div className="text-xl md:text-3xl font-serif text-stone-900 mb-0.5">{formatNumber(stats.reviews)}</div>
                   <div className="text-[8px] md:text-[9px] uppercase tracking-widest text-stone-400 font-bold">Reviews</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Clean Activity Feed - Hidden on small mobile */}
        <div className="relative h-[650px] overflow-hidden hidden md:block">
            {/* Top/Bottom Fade Masks */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none" />
            
            <div className="flex flex-col gap-6 animate-scroll-vertical-slow hover:pause-animation">
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
    <div className="bg-white border border-stone-100 p-6 rounded-3xl hover:border-stone-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 group">
      <div className="flex items-start gap-6">
        {/* Perfume Thumbnail */}
        <div className="relative w-16 h-16 bg-stone-50 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-50 group-hover:border-stone-100 transition-colors">
          {item.perfume_image ? (
            <Image 
              src={item.perfume_image} 
              alt={item.perfume_name} 
              fill 
              className="object-contain p-2 mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-500"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full bg-stone-100" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-bold text-stone-900 uppercase tracking-wider">{item.user_name}</h4>
            <span className="text-[10px] text-stone-400 font-medium">{formatTimeAgo(item.created_at)}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${item.type === 'review' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                {item.type === 'review' ? 'Review' : 'Comment'}
            </span>
            <div className="h-px flex-1 bg-stone-50" />
          </div>

          <div className="font-serif text-base text-stone-900 mb-2 truncate group-hover:text-stone-600 transition-colors">
            {item.perfume_name}
          </div>

          {item.content && (
            <p className="text-sm text-stone-500 line-clamp-2 font-light leading-relaxed">
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