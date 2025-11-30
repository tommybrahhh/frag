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

  return {
    mixName,
    safety: Math.round(safety),
    verdict,
    description,
    warnings,
    tips,
    combinedVibes: combinedVibes.slice(0, 6),
    riskFactors: {
      totalVibes: uniqueVibeCount,
      clashCount: warnings.length,
      harmonyCount: tips.length
    }
  };
}