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

// Volatility classification for notes
const VOLATILITY_CLASSIFICATION: Record<string, string[]> = {
  Top: [
    'bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin', 'lime', 'neroli',
    'petitgrain', 'lavender', 'rosemary', 'basil', 'mint', 'eucalyptus',
    'black pepper', 'anise', 'aldehydes', 'green notes', 'light fruits'
  ],
  Heart: [
    'rose', 'jasmine', 'ylang ylang', 'tuberose', 'lily', 'carnation', 'iris',
    'geranium', 'chamomile', 'clove', 'cinnamon', 'cardamom', 'nutmeg',
    'cumin', 'sage', 'thyme', 'tea', 'fruity notes', 'spicy notes'
  ],
  Base: [
    'sandalwood', 'cedar', 'patchouli', 'oakmoss', 'vetiver', 'amber', 'vanilla',
    'tonka', 'benzoin', 'labdanum', 'musk', 'leather', 'tobacco', 'incense',
    'myrrh', 'frankincense', 'oud', 'gourmand notes', 'woody notes'
  ]
};

// Function to classify note by volatility
export function classifyNoteVolatility(noteName: string): string {
  const name = noteName.toLowerCase();
  
  for (const [volatility, notes] of Object.entries(VOLATILITY_CLASSIFICATION)) {
    if (notes.some(note => name.includes(note) || note.includes(name))) {
      return volatility;
    }
  }
  
  // Default to Heart for unknown notes
  return 'Heart';
}

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
      const tempResult = mixPerfumes(basePerfume, perfume, 0.5);
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
    if (hasSimpleProfile) score += 10; // Reduced from 20

    // Boost: Perfumes from the same brand
    if (basePerfume.brand_name === perfume.brand_name) score += 10; // Reduced from 15

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

    // NEW: Scent Profile Compatibility (Complementary Scoring)
    const baseProfile = basePerfume.scent_profile || {};
    const perfumeProfile = perfume.scent_profile || {};
    const traits = ['fresh', 'sweet', 'spicy', 'depth'];
    let complementaryProfileScore = 0;

    if (Object.keys(baseProfile).length > 0 && Object.keys(perfumeProfile).length > 0) {
      traits.forEach(trait => {
        const baseVal = baseProfile[trait] || 0;
        const perfumeVal = perfumeProfile[trait] || 0;

        if (baseVal < 4 && perfumeVal > 6) {
          complementaryProfileScore += 20; // Strong complement: Fills a gap (increased from 10)
        } else if (baseVal >= 4 && baseVal <= 6 && perfumeVal > 6) {
          complementaryProfileScore += 10; // Enhancement: Boosts a moderate aspect (increased from 5)
        } else if (baseVal > 6 && perfumeVal < 4) {
          complementaryProfileScore -= 10; // Potential dilution: Weakens a strong aspect (increased from -5)
        } else {
          complementaryProfileScore += 2; // Neutral or slight boost for presence (increased from 1)
        }
      });
      score += Math.max(0, complementaryProfileScore * 2); // Ensure non-negative and add to score (multiplied by 2)
    }

    return { ...perfume, compatibilityScore: score };
  });

  // Sort by score and return top 4
  return scoredPerfumes
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 4);
}

// Function to analyze ingredient combinations for clashes and harmonies
export function analyzeIngredientCombination(ingredients: any[]): {
  warnings: string[];
  tips: string[];
  hasClash: boolean;
  hasHarmony: boolean;
} {
  const warnings: string[] = [];
  const tips: string[] = [];
  
  const families = ingredients.map(ing => ing.family).filter(Boolean);
  const uniqueFamilies = Array.from(new Set(families));

  // Check for major clashes
  uniqueFamilies.forEach(family1 => {
    uniqueFamilies.forEach(family2 => {
      if (family1 !== family2) {
        if (PERFUME_ALCHEMY_RULES.MAJOR_CLASHES[family1]?.includes(family2)) {
          warnings.push(`🚫 Warning: ${family1} and ${family2} notes often clash`);
        }
        if (PERFUME_ALCHEMY_RULES.MINOR_CLASHES[family1]?.includes(family2)) {
          warnings.push(`⚠️ Note: ${family1} and ${family2} can be challenging to balance`);
        }
        if (PERFUME_ALCHEMY_RULES.HARMONIOUS_PAIRS[family1]?.includes(family2)) {
          tips.push(`✨ Classic: ${family1} and ${family2} create beautiful harmony`);
        }
      }
    });
  });

  // Check for classic accords
  const ingredientNames = ingredients.map(ing => ing.name.toLowerCase());
  
  // Classic Chypre: Oakmoss + Bergamot + Patchouli/Labdanum
  const hasChypre = (
    ingredientNames.includes('oakmoss') && 
    ingredientNames.includes('bergamot') &&
    (ingredientNames.includes('patchouli') || ingredientNames.includes('labdanum'))
  );

  // Classic Fougère: Lavender + Oakmoss + Coumarin
  const hasFougere = (
    ingredientNames.includes('lavender') && 
    ingredientNames.includes('oakmoss') &&
    ingredientNames.includes('coumarin')
  );

  // Oriental Accord: Vanilla + Amber + Spices
  const hasOriental = (
    ingredientNames.includes('vanilla') && 
    ingredientNames.includes('amber') &&
    (ingredientNames.includes('cinnamon') || ingredientNames.includes('clove') || ingredientNames.includes('cardamom'))
  );

  // Citrus Aromatic: Citrus + Herbal notes
  const hasCitrusAromatic = (
    (ingredientNames.includes('bergamot') || ingredientNames.includes('lemon') || ingredientNames.includes('orange')) &&
    (ingredientNames.includes('lavender') || ingredientNames.includes('rosemary') || ingredientNames.includes('thyme'))
  );

  if (hasChypre) {
    tips.push('🏛️ Classic Chypre Accord Detected: Timeless elegance with mossy depth');
  }
  if (hasFougere) {
    tips.push('🌿 Classic Fougère Accord Detected: Aromatic fougère structure');
  }
  if (hasOriental) {
    tips.push('🌅 Classic Oriental Accord Detected: Warm, spicy, and sensual');
  }
  if (hasCitrusAromatic) {
    tips.push('🍋 Citrus Aromatic Accord Detected: Fresh and invigorating');
  }

  // Check for synergistic families
  PERFUME_ALCHEMY_RULES.SYNERGISTIC_FAMILIES.forEach(([family1, family2]) => {
    if (families.includes(family1) && families.includes(family2)) {
      tips.push(`🌟 Synergy: ${family1} and ${family2} families complement each other perfectly`);
    }
  });

  return {
    warnings: Array.from(new Set(warnings)), // Remove duplicates
    tips: Array.from(new Set(tips)), // Remove duplicates
    hasClash: warnings.length > 0,
    hasHarmony: tips.length > 0
  };
}

export function mixPerfumes(p1: any, p2: any, ratio: number = 0.5) {
  // Helper to extract and deduplicate notes by type
  const getNotes = (pos: string) => {
    const n1 = p1.perfume_notes?.filter((n:any) => n.type === pos).map((n:any) => n.note.name) || [];
    const n2 = p2.perfume_notes?.filter((n:any) => n.type === pos).map((n:any) => n.note.name) || [];
    return Array.from(new Set([...n1, ...n2])); // Deduplicate
  };

  const pyramid = {
    top: getNotes('Top'),
    heart: getNotes('Heart'),
    base: getNotes('Base')
  };

  // 1. GENERATE CREATIVE NAME
  const b1 = p1.brand?.name || p1.brand_name || 'Unknown';
  const b2 = p2.brand?.name || p2.brand_name || 'Unknown';
  const n1 = p1.name || 'Scent A';
  const n2 = p2.name || 'Scent B';

  const nameOptions = [
    () => `${n1.split(' ')[0]} ${n2.split(' ').pop()}`,
    () => `${n1.split(' ')[0]} & ${n2.split(' ')[0]}`,
    // Only use brand name if it's valid
    () => (b1 !== 'Unknown' && b1 === b2) ? `${b1} Fusion` : `${n1.split(' ')[0]} ${b2}`,
    () => {
      const shared = p1.vibe_tags?.filter((v: string) => p2.vibe_tags?.includes(v)) || [];
      return shared.length > 0 ? `${shared[0]} Nocturne` : `The ${n1.split(' ')[0]} Blend`;
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

  // Safety adjustments for extreme ratios
  let safetyAdjustment = 0;
  if (ratio >= 0.9 || ratio <= 0.1) {
    // Extreme ratios (90/10 or 10/90) reduce clash risk significantly
    safetyAdjustment = 20;
  } else if (ratio >= 0.8 || ratio <= 0.2) {
    // High ratios (80/20 or 20/80) reduce clash risk moderately
    safetyAdjustment = 10;
  }

  // Apply safety adjustment to risk score
  riskScore = Math.max(0, riskScore - safetyAdjustment);

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

  // NEW: Calculate Weighted Profile using ratio
  // If p1 or p2 is missing a profile, default to 0
  const getVal = (p: any, key: string) => p.scent_profile?.[key] || 0;

  const newProfile = {
    fresh: (getVal(p1, 'fresh') * ratio) + (getVal(p2, 'fresh') * (1 - ratio)),
    sweet: (getVal(p1, 'sweet') * ratio) + (getVal(p2, 'sweet') * (1 - ratio)),
    spicy: (getVal(p1, 'spicy') * ratio) + (getVal(p2, 'spicy') * (1 - ratio)),
    depth: (getVal(p1, 'depth') * ratio) + (getVal(p2, 'depth') * (1 - ratio)),
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

  // Dominant notes ordering: If ratio > 0.7, base perfume's notes appear first
  let orderedCombinedVibes = combinedVibes;
  if (ratio > 0.7) {
    // Sort vibes: p1's vibes first, then p2's, then others
    const p1Vibes = p1.vibe_tags || [];
    const p2Vibes = p2.vibe_tags || [];
    orderedCombinedVibes = [
      ...p1Vibes.filter((v: string) => combinedVibes.includes(v)),
      ...p2Vibes.filter((v: string) => combinedVibes.includes(v) && !p1Vibes.includes(v)),
      ...combinedVibes.filter((v: string) => !p1Vibes.includes(v) && !p2Vibes.includes(v))
    ];
  }

  // Generate visual representation
  const generateVisualization = () => {
    const dominantVibes = orderedCombinedVibes.slice(0, 3);
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
    combinedVibes: orderedCombinedVibes.slice(0, 6),
    newProfile, // <--- The new Visual Data
    riskFactors: {
      totalVibes: uniqueVibeCount,
      clashCount: warnings.length,
      harmonyCount: tips.length
    },
    performance,
    visualization,
    pyramid,
    mixingTips: [
      safety >= 70 ? "Apply base first, wait 2 minutes, then layer top" : "Test on skin first before full application",
      safety >= 50 ? "70/30 ratio recommended" : "50/50 ratio with caution",
      uniqueVibeCount > 4 ? "Consider simplifying - focus on 2-3 dominant notes" : "Good complexity level"
    ]
  };
}