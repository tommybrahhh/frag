'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface ScentRadarProps {
  profile: {
    fresh: number;
    sweet: number;
    spicy: number;
    depth: number;
    [key: string]: number; // Allow for expansion
  };
}

export default function ScentRadar({ profile }: ScentRadarProps) {
  // Transform the object { fresh: 8, ... } into Array [{ subject: 'Fresh', A: 8 }, ...]
  const data = Object.entries(profile).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
    A: value,
    fullMark: 10,
  }));

  return (
    <div className="w-full h-[250px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          {/* The Web Grid */}
          <PolarGrid stroke="#e5e7eb" />
          
          {/* The Labels (Fresh, Sweet...) */}
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 'bold' }}
          />
          
          {/* The Shape */}
          <Radar
            name="Scent Profile"
            dataKey="A"
            stroke="#1c1917" // Stone-900
            strokeWidth={2}
            fill="#1c1917"   // Stone-900
            fillOpacity={0.1} // Subtle transparency
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}