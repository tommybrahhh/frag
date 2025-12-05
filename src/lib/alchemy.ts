import { createClient } from '@/lib/supabase';

// Define complex interaction rules for perfume mixing
interface AlchemyRules {
  MAJOR_CLASHES: Record<string, string[]>;
  MINOR_CLASHES: Record<string, string[]>;
  HARMONIOUS_PAIRS: Record<string, string[]>;
  SYNERGISTIC_FAMILIES: string[][];
}

const PERFUME_ALCHEMY_RULES: AlchemyRules = {
  // Major clashes - these combinations are generally problematic
  MAJOR_CLASHES: {
    'Marine': ['Gourmand', 'Sweet', 'Vanilla', 'Amber', 'Spicy'],
    'Gourmand': ['Marine', 'Aquatic', 'Green', 'Fresh', 'Citrus'],
    'Animalic': ['Fresh', 'Citrus', 'Green', 'Floral', 'Fruity'],
    'Leather': ['Fruity', 'Gourmand', 'Sweet', 'Vanilla'],
    'Tobacco': ['Fresh', 'Marine', 'Aquatic', 'Green'],
  },
  
  // Minor clashes - these might work but require careful balancing
  MINOR_CLASHES: {
    'Spicy': ['Fresh', 'Marine', 'Green'],
    'Woody': ['Gourmand', 'Sweet', 'Fruity'],
    'Oriental': ['Fresh', 'Marine', 'Green'],
    'Floral': ['Animalic', 'Leather', 'Smoky'],
  },
  
  // Harmonious combinations - these generally work well together
  HARMONIOUS_PAIRS: {
    'Floral': ['Woody', 'Oriental', 'Spicy', 'Vanilla'],
    'Woody': ['Floral', 'Oriental', 'Spicy', 'Amber'],
    'Oriental': ['Floral', 'Woody', 'Spicy', 'Amber'],
    'Gourmand': ['Woody', 'Oriental', 'Spicy', 'Amber'],
    'Fresh': ['Citrus', 'Green', 'Aquatic'],
    'Citrus': ['Fresh', 'Green', 'Woody'],
  },
  
  // Synergistic families - perfumes from these categories enhance each other
  SYNERGISTIC_FAMILIES: [
    ['Floral', 'Oriental'],
    ['Woody', 'Amber'],
    ['Gourmand', 'Vanilla'],
    ['Fresh', 'Citrus'],
    ['Spicy', 'Oriental']
  ]
};

// Weighted scoring system
const SCORE_WEIGHTS = {
  MAJOR_CLASH: 40,
  MINOR_CLASH: 20,
  HARMONIOUS_PAIR: -25,
  SYNERGY_BONUS: -15,
  SAME_BRAND_BONUS: -10,
  SAME_FAMILY_BONUS: -8,
  DIVERSITY_PENALTY: 15, // Penalty for too many different vibe categories
  BASE_RISK: 10 // Base risk for any combination
};

// Function to get compatible perfumes based on the selected base
export async function getCompatiblePerfumes(basePerfume: any): Promise<any[]> {
  const supabase = createClient();
  
  // Get all perfumes from the database
  const { data: allPerfumes } = await supabase
    .from('perfumes')
    .select('*')
    .limit(100); // Limit for performance

  if (!allPerfumes) return [];

  // Score perfumes based on compatibility with base
  const scoredPerfumes = allPerfumes
    .filter((p: any) => p.id !== basePerfume.id) // Exclude the base perfume itself
    .map((perfume: any) => {
      const tempResult = mixPerfumes(basePerfume, perfume);
      return {
        ...perfume,
        compatibilityScore: tempResult.safety,
        compatibilityTips: tempResult.tips,
        compatibilityWarnings: tempResult.warnings
      };
    })
    .sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore); // Sort by best compatibility

  return scoredPerfumes.slice(0, 10); // Return top 10 most compatible
}

// New function to find layering matches for smart suggestions
export function findLayeringMatches(basePerfume: any, allPerfumes: any[]): any[] {
  if (!basePerfume || !allPerfumes.length) return [];

  // Filter out the base perfume
  const otherPerfumes = allPerfumes.filter(p => p.id !== basePerfume.id);

  // Filter out clashing families
  const baseVibes = basePerfume.vibe_tags || [];
  const clashingVibes = new Set<string>();
  
  // Find all clashing vibes for the base perfume
  baseVibes.forEach((vibe: string) => {
    if (PERFUME_ALCHEMY_RULES.MAJOR_CLASHES[vibe]) {
      PERFUME_ALCHEMY_RULES.MAJOR_CLASHES[vibe].forEach(clash => clashingVibes.add(clash));
    }
  });

  // Filter perfumes that don't have clashing vibes
  const nonClashingPerfumes = otherPerfumes.filter(p => {
    const perfumeVibes = p.vibe_tags || [];
    return !perfumeVibes.some((vibe: string) => clashingVibes.has(vibe));
  });

  // Score each perfume based on compatibility factors
  const scoredPerfumes = nonClashingPerfumes.map(perfume => {
    let score = 0;
    const perfumeVibes = perfume.vibe_tags || [];

    // Boost: Perfumes with simple profiles (Musk, Vanilla, Iso E Super)
    const simpleProfiles = ['Musk', 'Vanilla', 'Iso E Super'];
    const hasSimpleProfile = perfumeVibes.some((vibe: string) =>
      simpleProfiles.some(simple => vibe.toLowerCase().includes(simple.toLowerCase()))
    );
    if (hasSimpleProfile) score += 20;

    // Boost: Perfumes from the same brand
    if (basePerfume.brand_name === perfume.brand_name) score += 15;

    // Boost: Shared harmonious vibes
    baseVibes.forEach((baseVibe: string) => {
      perfumeVibes.forEach((perfumeVibe: string) => {
        if (PERFUME_ALCHEMY_RULES.HARMONIOUS_PAIRS[baseVibe]?.includes(perfumeVibe)) {
          score += 10;
        }
      });
    });

    // Boost: Synergistic families
    PERFUME_ALCHEMY_RULES.SYNERGISTIC_FAMILIES.forEach(([family1, family2]) => {
      if ((baseVibes.includes(family1) && perfumeVibes.includes(family2)) ||
          (baseVibes.includes(family2) && perfumeVibes.includes(family1))) {
        score += 12;
      }
    });

    return { ...perfume, compatibilityScore: score };
  });

  // Sort by score and return top 4
  return scoredPerfumes
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 4);
}

export function mixPerfumes(p1: any, p2: any) {
  // 1. GENERATE CREATIVE NAME
  const nameOptions = [
    // Option 1: First word of P1 + Last word of P2
    () => `${p1.name.split(' ')[0]} ${p2.name.split(' ')[p2.name.split(' ').length - 1]}`,
    // Option 2: Creative combinations
    () => `${p1.name.split(' ')[0]} & ${p2.name.split(' ')[0]}`,
    // Option 3: Brand-based naming
    () => p1.brand_name === p2.brand_name
      ? `${p1.brand_name} Fusion`
      : `${p1.name.split(' ')[0]} ${p2.brand_name}`,
    // Option 4: Vibe-based naming
    () => {
      const sharedVibes = p1.vibe_tags?.filter((v: string) => p2.vibe_tags?.includes(v)) || [];
      return sharedVibes.length > 0
        ? `${sharedVibes[0]} Nocturne`
        : `${p1.name.split(' ')[0]} Essence`;
    }
  ];
  
  const mixName = nameOptions[Math.floor(Math.random() * nameOptions.length)]();

  // 2. ANALYZE VIBES
  const combinedVibes = Array.from(new Set([...(p1.vibe_tags || []), ...(p2.vibe_tags || [])]));
  
  // 3. COMPREHENSIVE SAFETY ANALYSIS
  let riskScore = SCORE_WEIGHTS.BASE_RISK;
  let warnings: string[] = [];
  let tips: string[] = [];

  // Check for major clashes
  p1.vibe_tags?.forEach((v1: string) => {
    p2.vibe_tags?.forEach((v2: string) => {
      if (v1 in PERFUME_ALCHEMY_RULES.MAJOR_CLASHES &&
          PERFUME_ALCHEMY_RULES.MAJOR_CLASHES[v1].includes(v2)) {
        riskScore += SCORE_WEIGHTS.MAJOR_CLASH;
        warnings.push(`🚫 Major clash: ${v1} + ${v2} creates discordant notes`);
      }
    });
  });

  // Check for minor clashes
  p1.vibe_tags?.forEach((v1: string) => {
    p2.vibe_tags?.forEach((v2: string) => {
      if (v1 in PERFUME_ALCHEMY_RULES.MINOR_CLASHES &&
          PERFUME_ALCHEMY_RULES.MINOR_CLASHES[v1].includes(v2)) {
        riskScore += SCORE_WEIGHTS.MINOR_CLASH;
        warnings.push(`⚠️ Challenging: ${v1} + ${v2} requires careful balance`);
      }
    });
  });

  // Check for harmonious pairs
  p1.vibe_tags?.forEach((v1: string) => {
    p2.vibe_tags?.forEach((v2: string) => {
      if (v1 in PERFUME_ALCHEMY_RULES.HARMONIOUS_PAIRS &&
          PERFUME_ALCHEMY_RULES.HARMONIOUS_PAIRS[v1].includes(v2)) {
        riskScore += SCORE_WEIGHTS.HARMONIOUS_PAIR;
        tips.push(`✨ Harmony: ${v1} + ${v2} creates beautiful accords`);
      }
    });
  });

  // Check for synergistic families
  PERFUME_ALCHEMY_RULES.SYNERGISTIC_FAMILIES.forEach(([family1, family2]) => {
    if (p1.vibe_tags?.includes(family1) && p2.vibe_tags?.includes(family2) ||
        p1.vibe_tags?.includes(family2) && p2.vibe_tags?.includes(family1)) {
      riskScore += SCORE_WEIGHTS.SYNERGY_BONUS;
      tips.push(`🌟 Synergy: ${family1} and ${family2} families complement each other`);
    }
  });

  // Brand compatibility bonus
  if (p1.brand_name === p2.brand_name) {
    riskScore += SCORE_WEIGHTS.SAME_BRAND_BONUS;
    tips.push(`🏠 House DNA: Same brand perfumes often blend well`);
  }

  // Diversity penalty - too many different categories can be chaotic
  const uniqueVibeCount = combinedVibes.length;
  if (uniqueVibeCount > 4) {
    riskScore += SCORE_WEIGHTS.DIVERSITY_PENALTY * (uniqueVibeCount - 4);
    warnings.push(`🌀 Complex: ${uniqueVibeCount} different vibe categories may create chaos`);
  }

  // Normalize score and determine verdict
  const safety = Math.max(0, Math.min(100, 100 - riskScore));

  let verdict = "Masterpiece Blend";
  let description = "Exceptional harmony with complex depth";
  
  if (safety >= 85) {
    verdict = "Masterpiece Blend";
    description = "Exceptional harmony with complex depth";
  } else if (safety >= 70) {
    verdict = "Harmonious Blend";
    description = "Well-balanced with good complementarity";
  } else if (safety >= 50) {
    verdict = "Experimental Mix";
    description = "Interesting combination with some challenges";
  } else if (safety >= 30) {
    verdict = "Risky Experiment";
    description = "Bold combination that might not work for everyone";
  } else {
    verdict = "Biohazard Warning";
    description = "Strong potential for discordant notes";
  }

  // NEW: Calculate Merged Profile (Taking the MAX intensity of each trait)
  // If p1 or p2 is missing a profile, default to 0
  const getVal = (p: any, key: string) => p.scent_profile?.[key] || 0;

  const newProfile = {
    fresh: Math.max(getVal(p1, 'fresh'), getVal(p2, 'fresh')),
    sweet: Math.max(getVal(p1, 'sweet'), getVal(p2, 'sweet')),
    spicy: Math.max(getVal(p1, 'spicy'), getVal(p2, 'spicy')),
    depth: Math.max(getVal(p1, 'depth'), getVal(p2, 'depth')),
  };

  // Calculate performance metrics
  const calculatePerformance = () => {
    let longevity = 8; // Base hours
    let sillage = 3; // Base sillage (1-5 scale)
    let projection = 2; // Base projection (1-5 scale)
    
    // Adjust based on perfume characteristics
    if (p1.vibe_tags?.includes('Oriental') || p2.vibe_tags?.includes('Oriental')) {
      longevity += 2;
      sillage += 1;
    }
    if (p1.vibe_tags?.includes('Woody') || p2.vibe_tags?.includes('Woody')) {
      longevity += 1;
      projection += 1;
    }
    if (p1.vibe_tags?.includes('Fresh') || p2.vibe_tags?.includes('Fresh')) {
      longevity -= 2;
      projection -= 1;
    }
    if (p1.vibe_tags?.includes('Citrus') || p2.vibe_tags?.includes('Citrus')) {
      longevity -= 1;
    }
    
    return {
      longevity: Math.max(2, Math.min(12, longevity)),
      sillage: Math.max(1, Math.min(5, sillage)),
      projection: Math.max(1, Math.min(5, projection))
    };
  };

  const performance = calculatePerformance();

  // Generate visual representation
  const generateVisualization = () => {
    const dominantVibes = combinedVibes.slice(0, 3);
    const colors: Record<string, string> = {
      'Floral': '#FF9FF3',
      'Woody': '#A55EEA',
      'Oriental': '#FD7272',
      'Fresh': '#2ECC71',
      'Gourmand': '#FEA47F',
      'Spicy': '#EAB543',
      'Citrus': '#F97F51',
      'Aquatic': '#25CCF7',
      'Green': '#55E6C1',
      'Amber': '#D6A2E8'
    };

    return dominantVibes.map(vibe => ({
      vibe,
      color: colors[vibe] || '#BDC581',
      intensity: Math.random() * 0.5 + 0.5 // Random intensity between 0.5-1
    }));
  };

  const visualization = generateVisualization();

  return {
    mixName,
    safety: Math.round(safety),
    verdict,
    description,
    warnings,
    tips,
    combinedVibes: combinedVibes.slice(0, 6),
    newProfile, // <--- The new Visual Data
    riskFactors: {
      totalVibes: uniqueVibeCount,
      clashCount: warnings.length,
      harmonyCount: tips.length
    },
    performance,
    visualization,
    mixingTips: [
      safety >= 70 ? "Apply base first, wait 2 minutes, then layer top" : "Test on skin first before full application",
      safety >= 50 ? "70/30 ratio recommended" : "50/50 ratio with caution",
      uniqueVibeCount > 4 ? "Consider simplifying - focus on 2-3 dominant notes" : "Good complexity level"
    ]
  };
}