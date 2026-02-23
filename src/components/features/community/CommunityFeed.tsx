'use client';

import { useState, useEffect } from 'react';
import { ActivityItem } from '@/lib/services/communityService';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '@/utils/timeUtils';

export default function CommunityFeed({ initialActivity }: { initialActivity: ActivityItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!initialActivity || initialActivity.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-200">
        <p className="text-stone-500">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {initialActivity.map((item, index) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group"
        >
          <div className="relative grid grid-cols-1 md:grid-cols-[60px_1fr] gap-6">
            
            {/* User Avatar Column */}
            <div className="hidden md:flex flex-col items-center pt-1">
               <div className="w-12 h-12 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 font-serif text-lg shadow-sm group-hover:border-amber-200 transition-all duration-500 overflow-hidden">
                  {item.user_avatar ? (
                    <img src={item.user_avatar} alt={item.user_name} className="w-full h-full object-cover" />
                  ) : (
                    item.user_name.slice(0, 1).toUpperCase()
                  )}
               </div>
               <div className="w-[1px] h-full bg-gradient-to-b from-stone-200 to-transparent mt-4" />
            </div>

            <div className="flex-1 min-w-0">
               {/* Metadata Header */}
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="md:hidden w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-[9px] border border-stone-200">
                      {item.user_name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-stone-900 text-[10px] uppercase tracking-widest">{item.user_name}</span>
                    <span className="w-1 h-1 rounded-full bg-stone-300" />
                    <span className="text-stone-400 text-[9px] font-medium uppercase tracking-widest">
                       {item.type === 'review' ? 'Review' : 'Comment'}
                    </span>
                  </div>
                  <span className="text-stone-400 text-[9px] font-bold uppercase tracking-widest">
                    {mounted ? formatRelativeTime(item.created_at) : ''}
                  </span>
               </div>

               {/* Activity Card */}
               <div className="bg-white p-6 md:p-8 rounded-[32px] border border-stone-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] group-hover:shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all duration-500 relative overflow-hidden">
                  
                  {/* Perfume Context */}
                  <Link 
                    href={`/perfume/${item.perfume_slug || '#'}`} 
                    className="flex items-center gap-4 mb-6 group/link"
                  >
                    <div className="w-14 h-14 bg-[#FDFDFB] rounded-xl flex-shrink-0 p-2 border border-stone-50 shadow-sm group-hover/link:shadow-md transition-all duration-500">
                       {item.perfume_image ? (
                          <Image 
                            src={item.perfume_image} 
                            alt={item.perfume_name} 
                            width={56} 
                            height={56} 
                            className="w-full h-full object-contain mix-blend-multiply group-hover/link:scale-110 transition-transform duration-700" 
                            unoptimized 
                          />
                       ) : (
                          <div className="w-full h-full bg-stone-50 rounded-lg flex items-center justify-center">
                            <span className="text-[8px] text-stone-300">N/A</span>
                          </div>
                       )}
                    </div>
                    <div>
                       <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-600/60 mb-1">
                          {item.brand_name}
                       </div>
                       <div className="font-serif text-lg text-stone-900 group-hover/link:text-amber-900 transition-colors">
                          {item.perfume_name}
                       </div>
                    </div>
                  </Link>

                  {/* Content */}
                  {item.content && (
                    <div className="prose prose-stone max-w-none text-stone-600 font-light leading-relaxed italic mb-6 text-sm">
                       <p>"{item.content}"</p>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                    <div className="flex items-center gap-4">
                      {item.rating && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Score</span>
                          <span className="font-serif text-lg text-stone-900">{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-stone-300 group-hover:text-stone-900 transition-colors duration-500">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">View Thread</span>
                      <div className="w-4 h-[1px] bg-stone-100 group-hover:w-8 group-hover:bg-stone-900 transition-all duration-500" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}