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
    <section className="py-16 bg-white">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2 block">
            Daily Face-off
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900">
            Which one do you prefer?
          </h2>
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16">
          
          {/* VS Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-white rounded-full flex items-center justify-center font-black text-xl shadow-xl border-4 border-stone-50 text-stone-900 italic">
            VS
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
             <motion.p 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="text-center mt-8 text-stone-500 text-sm italic"
             >
               Thanks for voting! Come back tomorrow for a new battle.
             </motion.p>
        )}
      </div>
    </section>
  );
}

function BattleCard({ perfume, side, onClick, disabled, percentage, showResult }: any) {
  return (
    <motion.button 
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 w-full bg-stone-50 rounded-3xl p-6 md:p-10 border-2 transition-all duration-300 group
         ${disabled && showResult && percentage >= 50 ? 'border-green-500/20 bg-green-50/50' : 'border-transparent'}
         ${!disabled ? 'hover:border-stone-200 cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="relative aspect-square w-full max-w-[200px] mx-auto mb-6">
         {perfume.image_url ? (
            <Image 
                src={perfume.image_url} 
                alt={perfume.name} 
                fill 
                className="object-contain mix-blend-multiply drop-shadow-lg"
            />
         ) : (
            <div className="w-full h-full bg-stone-200 rounded-full" />
         )}
      </div>

      <div className="text-center relative z-10">
         <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">
            {perfume.brand?.name}
         </div>
         <h3 className="font-serif text-2xl text-stone-900 mb-4">{perfume.name}</h3>
         
         {!showResult ? (
            <span className={`inline-block px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors
                ${side === 'left' ? 'bg-stone-900 text-white' : 'bg-white text-stone-900 border border-stone-200'}
                ${!disabled && 'group-hover:bg-stone-800 group-hover:text-white'}
            `}>
                Vote This
            </span>
         ) : (
            <div className="space-y-2">
                <div className="text-4xl font-bold text-stone-900">{percentage}%</div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${percentage}%` }}
                       className={`h-full ${percentage >= 50 ? 'bg-green-500' : 'bg-stone-400'}`}
                    />
                </div>
                <div className="text-xs text-stone-400 font-bold uppercase tracking-wider">{perfume.votes} Votes</div>
            </div>
         )}
      </div>
    </motion.button>
  );
}
