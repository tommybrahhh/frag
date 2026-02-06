'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface ComparisonScentRadarProps {
  slots: (any | null)[];
  colors: string[];
}

export default function ComparisonScentRadar({ slots, colors }: ComparisonScentRadarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (chartRef.current) {
            setDimensions({
                width: chartRef.current.offsetWidth,
                height: chartRef.current.offsetHeight,
            });
        }
    };
    
    // Initial measure
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Get Unique Keys (Attributes)
  const allKeys = new Set<string>();
  slots.forEach(slot => {
    if (slot && slot.scent_profile) {
      Object.keys(slot.scent_profile).forEach(k => allKeys.add(k));
    }
  });

  const attributes = Array.from(allKeys);

  if (attributes.length === 0) {
    return (
        <div className="h-[300px] flex items-center justify-center text-stone-400 italic">
            Add perfumes with scent profiles to compare.
        </div>
    );
  }

  // 2. Format Data for Recharts
  // Shape: [{ subject: 'Fresh', slot0: 5, slot1: 8, ... }, ...]
  const data = attributes.map(attr => {
    const row: any = { subject: attr.charAt(0).toUpperCase() + attr.slice(1) };
    slots.forEach((slot, index) => {
      if (slot && slot.scent_profile) {
        row[`slot${index}`] = slot.scent_profile[attr] || 0;
      } else {
        row[`slot${index}`] = 0;
      }
    });
    return row;
  });

  return (
    <div ref={chartRef} className="w-full h-[400px] flex items-center justify-center relative">
      {/* Legend Override (Optional custom legend if Recharts default is ugly) */}
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#78716c', fontSize: 12, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
          
          {slots.map((slot, index) => {
            if (!slot) return null;
            return (
              <Radar
                key={index}
                name={slot.name}
                dataKey={`slot${index}`}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                fill={colors[index % colors.length]}
                fillOpacity={0.1}
              />
            );
          })}
          
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
