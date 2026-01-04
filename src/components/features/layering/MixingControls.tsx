'use client';

import React from 'react';

interface MixingControlsProps {
  ratio: number;
  onRatioChange: (val: number) => void;
  onSwap: () => void;
}

export default function MixingControls({ ratio, onRatioChange, onSwap }: MixingControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-4">
      <button
        onClick={onSwap}
        className="w-10 h-10 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-900 hover:border-stone-900 transition shadow-sm z-20"
        title="Swap Layers"
      >
        <span className="text-xl">⇄</span>
      </button>

      {/* Ratio Slider */}
      <div className="w-48 relative group">
        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-stone-400 mb-1 px-1">
          <span>Base</span>
          <span>{ratio}%</span>
          <span>Top</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={ratio}
          onChange={(e) => onRatioChange(Number(e.target.value))}
          className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-stone-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    </div>
  );
}
