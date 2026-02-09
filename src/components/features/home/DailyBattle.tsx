'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { voteInBattle } from '@/lib/actions/battleActions';

interface BattleProps {
  battle: {
    id: string;
    left: any;
    right: any;
    totalVotes: number;
  } | null;
}

export default function DailyBattle({ battle }: BattleProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [localStats, setLocalStats] = useState(battle);
  const [isVoting, setIsVoting] = useState(false);

  if (!battle || !localStats) return null;

  const handleVote = async (side: 'left' | 'right') => {
    if (hasVoted || isVoting) return;
    setIsVoting(true);

    // Optimistic Update
    const newStats = { ...localStats };
    if (side === 'left') {
        newStats.left.votes += 1;
    } else {
        newStats.right.votes += 1;
    }
    newStats.totalVotes += 1;
    setLocalStats(newStats);
    setHasVoted(true);

    await voteInBattle(battle.id, side);
    setIsVoting(false);
  };

  const leftPct = localStats.totalVotes === 0 ? 50 : Math.round((localStats.left.votes / localStats.totalVotes) * 100);
  const rightPct = 100 - leftPct;

  return (
    <section className="py-24 bg-white border-y border-stone-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
             <div className="h-[1px] w-8 bg-stone-300"></div>
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
               The Daily Face-off
             </span>
             <div className="h-[1px] w-8 bg-stone-300"></div>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-stone-900">
            Pick Your Favorite
          </h2>
        </div>

        <div className="relative flex flex-col md:flex-row items-stretch gap-6 md:gap-8">
          
          {/* VS Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center font-serif italic text-2xl shadow-xl border-[6px] border-white">
               vs
             </div>
          </div>

          {/* Left Contender */}
          <BattleCard 
            perfume={localStats.left} 
            side="left" 
            onClick={() => handleVote('left')}
            disabled={hasVoted}
            percentage={leftPct}
            showResult={hasVoted}
          />

          {/* Right Contender */}
          <BattleCard 
            perfume={localStats.right} 
            side="right" 
            onClick={() => handleVote('right')}
            disabled={hasVoted}
            percentage={rightPct}
            showResult={hasVoted}
          />
        </div>
        
        {hasVoted && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }}
               className="text-center mt-12"
             >
               <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Voting Closed for Today</p>
               <p className="font-serif text-stone-900 text-lg">Come back tomorrow for a new battle.</p>
             </motion.div>
        )}
      </div>
    </section>
  );
}

function BattleCard({ perfume, side, onClick, disabled, percentage, showResult }: any) {
  return (
    <motion.button 
      whileHover={!disabled ? { scale: 1.005 } : {}}
      whileTap={!disabled ? { scale: 0.995 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 w-full bg-stone-50 rounded-[2rem] p-8 md:p-10 transition-all duration-500 group overflow-hidden border border-stone-100 text-left
         ${disabled && showResult && percentage >= 50 ? 'ring-1 ring-stone-900 bg-stone-100' : ''}
         ${!disabled ? 'hover:border-stone-300 cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
         {/* Bottle Image - Wrapped in stone-50 to match card, effectively hiding white bg via blend */}
         <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0 bg-stone-50 rounded-2xl p-4">
            {perfume.image_url ? (
                <Image 
                    src={perfume.image_url} 
                    alt={perfume.name} 
                    fill 
                    className="object-contain mix-blend-multiply"
                    sizes="(max-width: 768px) 160px, 192px"
                />
            ) : (
                <div className="w-full h-full bg-stone-200 rounded-xl" />
            )}
         </div>

         {/* Info & Action */}
         <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left h-full justify-center pt-2">
             <div className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2">
                {perfume.brand?.name}
             </div>
             <h3 className="font-serif text-2xl text-stone-900 mb-6 leading-tight">{perfume.name}</h3>
             
             {!showResult ? (
                <span className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border
                    ${side === 'left' 
                       ? 'bg-stone-900 text-white border-stone-900 group-hover:bg-stone-800' 
                       : 'bg-white text-stone-900 border-stone-200 group-hover:border-stone-900'}
                `}>
                    Vote for This
                </span>
             ) : (
                <div className="w-full">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-serif text-stone-900">{percentage}%</span>
                        <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">of votes</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${percentage}%` }}
                           transition={{ duration: 1, ease: "circOut" }}
                           className={`h-full ${percentage >= 50 ? 'bg-stone-900' : 'bg-stone-400'}`}
                        />
                    </div>
                </div>
             )}
         </div>
      </div>
    </motion.button>
  );
}
