// src/lib/perfume-utils.ts

export const generateProfileFromVibes = (vibes: string[] | null) => {
  // Default baseline
  const profile = { fresh: 3, sweet: 3, spicy: 3, woody: 3, floral: 3, depth: 2 }; 
  
  if (!vibes || vibes.length === 0) return profile;

  const lowerVibes = vibes.map(v => v.toLowerCase());

  // Logic to boost scores based on tags
  if (lowerVibes.some(v => v.includes('citrus') || v.includes('fresh') || v.includes('aquatic') || v.includes('blue') || v.includes('green'))) profile.fresh += 6;
  if (lowerVibes.some(v => v.includes('gourmand') || v.includes('vanilla') || v.includes('sweet') || v.includes('fruity') || v.includes('sugar'))) profile.sweet += 6;
  if (lowerVibes.some(v => v.includes('spicy') || v.includes('warm') || v.includes('oriental') || v.includes('amber') || v.includes('cinnamon'))) profile.spicy += 6;
  if (lowerVibes.some(v => v.includes('woody') || v.includes('earthy') || v.includes('mossy') || v.includes('leather') || v.includes('dry'))) profile.woody += 6;
  if (lowerVibes.some(v => v.includes('floral') || v.includes('rose') || v.includes('white flower') || v.includes('bouquet'))) profile.floral += 6;
  
  // NEW: Depth Logic (Critical for Alchemy)
  if (lowerVibes.some(v => v.includes('dark') || v.includes('intense') || v.includes('night') || v.includes('oud') || v.includes('smoky') || v.includes('leather') || v.includes('tobacco'))) {
    profile.depth += 7;
  } else if (lowerVibes.some(v => v.includes('rich') || v.includes('warm'))) {
    profile.depth += 4;
  }

  // Cap max values at 10
  (Object.keys(profile) as (keyof typeof profile)[]).forEach(k => {
    if (profile[k] > 10) profile[k] = 10;
  });

  return profile;
};