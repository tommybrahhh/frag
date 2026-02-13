'use client';

import Link from 'next/link';
import { Contributor } from '@/lib/services/communityService'; // Assuming Contributor type is available here

interface TopContributorsClientProps {
  topContributors: Contributor[];
}

export default function TopContributorsClient({ topContributors }: TopContributorsClientProps) {
  if (topContributors.length === 0) return null;

  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between mb-8 md:mb-16 gap-4">
          <h2 className="font-serif text-2xl md:text-4xl text-stone-900">
            Top <span className="italic text-stone-400">Contributors</span>
          </h2>
          <Link href="/community" className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
            View All →
          </Link>
        </div>

        <div className="relative -mx-6 px-6">
          <div className="flex gap-3 md:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
            {topContributors.map((user) => (
              <Link 
                href={`/profile/${user.id}`} 
                key={user.id} 
                className="snap-start shrink-0 w-[140px] md:w-[240px] bg-stone-50 border border-stone-100 p-5 md:p-8 rounded-[2rem] text-center hover:bg-white hover:border-stone-200 hover:shadow-sm transition-all duration-300"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full overflow-hidden bg-white border border-stone-100">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg md:text-xl font-serif text-stone-300 bg-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className={`inline-block px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-bold uppercase tracking-widest mb-1.5 bg-stone-100 text-stone-500 border border-stone-200`}>
                  {user.level.icon}
                </div>

                <h4 className="font-serif text-sm md:text-lg text-stone-900 mb-0.5 truncate">{user.name}</h4>
                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {user.total_activity} Posts
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
