'use client';

import { Contributor } from '@/lib/services/communityService';
import { Medal } from 'lucide-react';

export default function TopContributors({ contributors }: { contributors: Contributor[] }) {
  if (!contributors || contributors.length === 0) {
     return <div className="text-stone-400 text-sm italic">No data yet.</div>;
  }

  return (
    <div className="space-y-4">
      {contributors.map((user, index) => (
        <div key={user.id} className="flex items-center gap-4">
           
           <div className="relative">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-xs border border-stone-200">
                  {user.name.slice(0, 2).toUpperCase()}
              </div>
              {index < 3 && (
                 <div className={`
                    absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm
                    ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-stone-400' : 'bg-orange-400'}
                 `}>
                    {index + 1}
                 </div>
              )}
           </div>

           <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-stone-900 truncate">{user.name}</div>
              <div className="text-xs text-stone-400">
                 {user.total_activity} contributions
              </div>
           </div>
           
           {index === 0 && <Medal className="w-4 h-4 text-yellow-500" />}

        </div>
      ))}
    </div>
  );
}
