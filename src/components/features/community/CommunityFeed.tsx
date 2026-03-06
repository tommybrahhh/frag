'use client';

import { useState, useEffect } from 'react';
import { ActivityItem } from '@/lib/services/communityService';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '@/utils/timeUtils';
import { FileText, MessageSquare } from 'lucide-react';

export default function CommunityFeed({ initialActivity }: { initialActivity: ActivityItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!initialActivity || initialActivity.length === 0) {
    return (
      <div className="text-center py-20 bg-stone-50 border border-dashed border-stone-200 rounded-3xl">
        <p className="text-stone-400 font-serif text-sm uppercase tracking-widest">No recent activity detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {initialActivity.map((item, index) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group relative"
        >
          <div className="flex gap-6">
            
            {/* Avatar Column */}
            <div className="hidden sm:flex flex-col items-center pt-2">
               <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 font-serif text-xl shadow-sm overflow-hidden z-10 transition-transform duration-300 group-hover:scale-105">
                  {item.user_avatar ? (
                    <img src={item.user_avatar} alt={item.user_name} className="w-full h-full object-cover transition-all duration-300" />
                  ) : (
                    item.user_name.slice(0, 1).toUpperCase()
                  )}
               </div>
            </div>

            <div className="flex-1 min-w-0">
               {/* Activity Context Box */}
               <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden">
                 <div className="p-6 md:p-8">
                    
                    {/* Metadata Header */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
                       <div className="sm:hidden w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex flex-shrink-0 items-center justify-center font-serif text-xs border border-stone-200">
                         {item.user_name.slice(0, 1).toUpperCase()}
                       </div>
                       
                       <span className="font-bold text-stone-900 text-sm uppercase tracking-widest">{item.user_name}</span>
                       <span className="text-stone-300 text-[10px]">•</span>
                       
                       <div className="flex items-center gap-1.5 text-stone-400 bg-stone-50/50 px-3 py-1 rounded-full border border-stone-100">
                          {item.type === 'review' ? <FileText size={12} /> : <MessageSquare size={12} />}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            {item.type === 'review' ? 'Published Review' : 'Commented'}
                          </span>
                       </div>

                       <span className="text-stone-400 text-[10px] font-medium uppercase ml-auto">
                         {mounted ? formatRelativeTime(item.created_at) : ''}
                       </span>
                    </div>

                    {/* Content */}
                    {item.content && (
                      <div className="text-stone-700 font-serif leading-relaxed md:text-xl md:leading-[1.8] mb-8 break-words font-light">
                         "{item.content}"
                      </div>
                    )}

                    {/* Perfume Reference Footer */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-stone-100">
                      
                      <Link 
                        href={`/perfume/${item.perfume_slug || '#'}`} 
                        className="flex items-center gap-4 group/link flex-1 min-w-0"
                      >
                        <div className="w-14 h-14 bg-stone-50 rounded-2xl flex-shrink-0 p-2 border border-stone-100 shadow-sm overflow-hidden">
                           {item.perfume_image ? (
                              <Image 
                                src={item.perfume_image} 
                                alt={item.perfume_name} 
                                width={56} 
                                height={56} 
                                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover/link:scale-110" 
                                unoptimized 
                              />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[10px] text-stone-300">N/A</span>
                              </div>
                           )}
                        </div>
                        <div className="min-w-0">
                           <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1 truncate">
                              {item.brand_name}
                           </div>
                           <div className="font-serif text-lg md:text-xl text-stone-900 group-hover/link:text-stone-500 transition-colors truncate tracking-tight">
                              {item.perfume_name}
                           </div>
                        </div>
                      </Link>

                      {item.rating && (
                        <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-100 self-start md:self-auto">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Score</span>
                          <span className="font-serif text-xl font-medium text-stone-900">{item.rating.toFixed(1)}</span>
                        </div>
                      )}

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