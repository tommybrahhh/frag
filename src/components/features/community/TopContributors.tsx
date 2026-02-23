'use client';

import { Contributor } from '@/lib/services/communityService';
import { Medal } from 'lucide-react';

export default function TopContributors({ contributors }: { contributors: Contributor[] }) {
  if (!contributors || contributors.length === 0) {
     return (
       <div className="py-8 text-center border border-dashed border-stone-100 rounded-2xl">
         <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Awaiting Voices</p>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      {contributors.map((user, index) => (
        <div key={user.id} className="group flex items-center gap-4">
           
           <div className="relative">
              <div className="w-12 h-12 rounded-[18px] bg-stone-50 flex items-center justify-center text-stone-400 font-serif text-lg border border-stone-100 overflow-hidden group-hover:border-amber-200 transition-all duration-500 shadow-sm group-hover:shadow-md">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    user.name.charAt(0)
                  )}
              </div>
              <div className={`
                absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-stone-900 shadow-md border border-stone-50 bg-white
              `}>
                {index + 1}
              </div>
           </div>

           <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-sm text-stone-900 truncate group-hover:text-amber-800 transition-colors">{user.name}</div>
                <div className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${user.level.border} ${user.level.bg} ${user.level.color}`}>
                  {user.level.icon}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400">
                   {user.comment_count} Comments
                </div>
                <div className="text-[9px] font-medium text-stone-500 italic opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                  {user.level.name}
                </div>
              </div>
           </div>

        </div>
      ))}
    </div>
  );
}