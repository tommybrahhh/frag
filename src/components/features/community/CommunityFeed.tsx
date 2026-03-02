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
    <div className="space-y-10">
      {initialActivity.map((item, index) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group"
        >
          <div className="relative grid grid-cols-1 md:grid-cols-[48px_1fr] gap-6">
            
            {/* User Avatar Column */}
            <div className="hidden md:flex flex-col items-center pt-1">
               <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 font-serif text-sm shadow-sm group-hover:border-stone-200 transition-all duration-300 overflow-hidden">
                  {item.user_avatar ? (
                    <img src={item.user_avatar} alt={item.user_name} className="w-full h-full object-cover" />
                  ) : (
                    item.user_name.slice(0, 1).toUpperCase()
                  )}
               </div>
               <div className="w-[1px] h-full bg-stone-100 mt-4" />
            </div>

            <div className="flex-1 min-w-0">
               {/* Metadata Header */}
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="md:hidden w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-[8px] border border-stone-200">
                      {item.user_name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-stone-900 text-[10px] uppercase tracking-wider">{item.user_name}</span>
                    <span className="text-stone-300 text-[10px]">•</span>
                    <span className="text-stone-400 text-[10px] font-medium uppercase tracking-wider">
                       {item.type === 'review' ? 'Review' : 'Comment'}
                    </span>
                  </div>
                  <span className="text-stone-400 text-[10px] font-medium uppercase tracking-wider">
                    {mounted ? formatRelativeTime(item.created_at) : ''}
                  </span>
               </div>

               {/* Activity Card */}
               <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm group-hover:shadow-md transition-all duration-300 relative">
                  
                  {/* Perfume Context */}
                  <Link 
                    href={`/perfume/${item.perfume_slug || '#'}`} 
                    className="flex items-center gap-4 mb-5 group/link"
                  >
                    <div className="w-12 h-12 bg-stone-50 rounded-lg flex-shrink-0 p-2 border border-stone-100 shadow-sm">
                       {item.perfume_image ? (
                          <Image 
                            src={item.perfume_image} 
                            alt={item.perfume_name} 
                            width={48} 
                            height={48} 
                            className="w-full h-full object-contain mix-blend-multiply" 
                            unoptimized 
                          />
                       ) : (
                          <div className="w-full h-full bg-stone-50 rounded flex items-center justify-center">
                            <span className="text-[8px] text-stone-300">N/A</span>
                          </div>
                       )}
                    </div>
                    <div>
                       <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                          {item.brand_name}
                       </div>
                       <div className="font-serif text-lg text-stone-900 group-hover/link:text-stone-600 transition-colors">
                          {item.perfume_name}
                       </div>
                    </div>
                  </Link>

                  {/* Content */}
                  {item.content && (
                    <div className="text-stone-600 font-light leading-relaxed italic mb-5 text-sm">
                       "{item.content}"
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-5 border-t border-stone-50">
                    <div className="flex items-center gap-4">
                      {item.rating && (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Rating</span>
                          <span className="font-serif text-lg text-stone-900">{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-900 transition-colors duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider">View Discussion</span>
                      <div className="w-4 h-[1px] bg-stone-200 group-hover:w-6 group-hover:bg-stone-900 transition-all duration-300" />
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