'use client';

import { Contributor } from '@/lib/services/communityService';
import { Medal } from 'lucide-react';

export default function TopContributors({ contributors }: { contributors: Contributor[] }) {
  if (!contributors || contributors.length === 0) {
     return <div className="text-stone-400 text-sm italic">No data yet.</div>;
  }

  return (
    <div className="space-y-6">
      {contributors.map((user, index) => (
        <div key={user.id} className="group flex items-center gap-4">
           
           <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 font-serif text-lg border border-stone-100 overflow-hidden group-hover:border-stone-200 transition-colors">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
              </div>
              <div className={`
                absolute -top-2 -right-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-stone-900 shadow-sm border border-stone-200 bg-white
              `}>
                {index + 1}
              </div>
           </div>

           <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-sm text-stone-900 truncate">{user.name}</div>
                <div className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-stone-500`}>
                  {user.level.icon}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                   {user.total_activity} Posts
                </div>
                <div className={`text-[9px] font-medium text-stone-500 italic`}>
                  {user.level.name}
                </div>
              </div>
           </div>

        </div>
      ))}
    </div>
  );
}
