'use client';

import { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

// 1. Updated Interface to match your generator function (fresh, woody, floral...)
interface ScentRadarProps {
  profile: {
    fresh?: number;
    sweet?: number;
    spicy?: number;
    woody?: number;
    floral?: number;
    depth?: number;
    [key: string]: number | undefined; 
  };
}

export default function ScentRadar({ profile }: ScentRadarProps) {
  // Safety Check
  if (!profile) return <div className="h-full flex items-center justify-center text-xs text-stone-300">No Data</div>;

  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (chartRef.current) {
      setDimensions({
        width: chartRef.current.offsetWidth,
        height: chartRef.current.offsetHeight,
      });
    }
  }, []);

  // 2. Transform Data & Filter non-numbers
  const data = Object.entries(profile)
    .filter(([_, value]) => typeof value === 'number') 
    .map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: value || 0,
      fullMark: 10,
    }));

  return (
    <div ref={chartRef} className="w-full h-[200px] md:h-[250px] flex items-center justify-center">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            {/* Grid lines */}
            <PolarGrid stroke="#e5e7eb" />
            
            {/* Labels */}
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#78716c', fontSize: 10, fontWeight: 'bold' }}
            />
            
            {/* 3. FIX: Force Scale to 0-10 so the shape is always relative to max score */}
            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
            
            {/* The Shape */}
            <Radar
              name="Scent Profile"
              dataKey="A"
              stroke="#1c1917" // Stone-900
              strokeWidth={2}
              fill="#1c1917"   // Stone-900
              fillOpacity={0.2} 
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
