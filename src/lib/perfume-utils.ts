// src/lib/perfume-utils.ts

export const generateProfileFromVibes = (vibes: string[] | null) => {
  // 1. Establish a Baseline (Never 0 to avoid multiplication errors)
  const profile = { fresh: 3, sweet: 3, spicy: 3, woody: 3, floral: 3, depth: 2 }; 
  
  if (!vibes || vibes.length === 0) return profile;

  const lowerVibes = vibes.map(v => v.toLowerCase());

  // 2. Freshness Boost
  if (lowerVibes.some(v => v.includes('citrus') || v.includes('fresh') || v.includes('aquatic') || v.includes('blue') || v.includes('green') || v.includes('sport'))) {
    profile.fresh += 6;
  }

  // 3. Sweetness/Gourmand Boost
  if (lowerVibes.some(v => v.includes('gourmand') || v.includes('vanilla') || v.includes('sweet') || v.includes('fruity') || v.includes('sugar') || v.includes('candy'))) {
    profile.sweet += 6;
  }

  // 4. Spicy/Warm Boost
  if (lowerVibes.some(v => v.includes('spicy') || v.includes('warm') || v.includes('oriental') || v.includes('amber') || v.includes('cinnamon'))) {
    profile.spicy += 6;
  }

  // 5. Woody/Earth Boost
  if (lowerVibes.some(v => v.includes('woody') || v.includes('earthy') || v.includes('mossy') || v.includes('leather') || v.includes('dry') || v.includes('forest'))) {
    profile.woody += 6;
  }

  // 6. Floral Boost
  if (lowerVibes.some(v => v.includes('floral') || v.includes('rose') || v.includes('white flower') || v.includes('bouquet') || v.includes('blossom'))) {
    profile.floral += 6;
  }
  
  // 7. Depth Calculation (Critical for "Alchemy" Logic)
  // This detects "Heavy" scents vs "Light" scents
  if (lowerVibes.some(v => v.includes('dark') || v.includes('intense') || v.includes('night') || v.includes('oud') || v.includes('smoky') || v.includes('leather') || v.includes('tobacco'))) {
    profile.depth += 7;
  } else if (lowerVibes.some(v => v.includes('rich') || v.includes('warm'))) {
    profile.depth += 4;
  } else if (lowerVibes.some(v => v.includes('fresh') || v.includes('light') || v.includes('summer'))) {
    profile.depth = 2; // Keep it light
  }

    // 8. Cap values at 10

    (Object.keys(profile) as (keyof typeof profile)[]).forEach(k => {

      if (profile[k] > 10) profile[k] = 10;

    });

  

    return profile;

  };

  

  /**

   * Normalizes a perfume image URL.

   * Handles:

   * 1. Full external URLs (starting with http/https)

   * 2. Already prefixed local paths (starting with /)

   * 3. Just filenames (should be in /Img/)

   * 4. Fallback for null/missing images

   */

  export const PLACEHOLDER_IMAGE = '/logo.svg'; // Using your logo as a high-quality fallback

  export const getPerfumeImage = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return PLACEHOLDER_IMAGE;

    // 1. External URL or Supabase Storage Full URL
    if (imageUrl.startsWith('http') || imageUrl.startsWith('//')) {
      return imageUrl;
    }

    // 2. Clean up the path
    let cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    
    if (cleanPath.startsWith('Img/')) {
      cleanPath = cleanPath.replace('Img/', '');
    }

    // 3. Normalization for common filename mismatches
    // Example: "Dior.Sauvage.jpg" -> "dior-sauvage.jpg"
    // Only apply this to local files (filenames without slashes)
    if (!cleanPath.includes('/')) {
        cleanPath = cleanPath.toLowerCase()
            .replace(/\s+/g, '-') // spaces to hyphens
            .replace(/\./g, '-')  // dots to hyphens (careful with extension)
            
        // Fix the extension dot we accidentally replaced
        if (cleanPath.includes('-jpg')) cleanPath = cleanPath.replace('-jpg', '.jpg');
        if (cleanPath.includes('-png')) cleanPath = cleanPath.replace('-png', '.png');
        if (cleanPath.includes('-webp')) cleanPath = cleanPath.replace('-webp', '.webp');
    }

    return `/Img/${encodeURIComponent(cleanPath)}`;
  };

  
