import { createClient } from '@/lib/supabase';

// ------------------------------------------------------------------
// CONFIGURATION & RULES
// ------------------------------------------------------------------

interface AlchemyRules {
  MAJOR_CLASHES: Record<string, string[]>;
  MINOR_CLASHES: Record<string, string[]>;
  HARMONIOUS_PAIRS: Record<string, string[]>;
  SYNERGISTIC_FAMILIES: string[][];
}

const PERFUME_ALCHEMY_RULES: AlchemyRules = {
  MAJOR_CLASHES: {
    'Marine': ['Gourmand', 'Sweet', 'Vanilla', 'Amber', 'Spicy'],
    'Gourmand': ['Marine', 'Aquatic', 'Green', 'Fresh', 'Citrus'],
    'Animalic': ['Fresh', 'Citrus', 'Green', 'Floral', 'Fruity'],
    'Leather': ['Fruity', 'Gourmand', 'Sweet', 'Vanilla'],
    'Tobacco': ['Fresh', 'Marine', 'Aquatic', 'Green'],
  },
  MINOR_CLASHES: {
    'Spicy': ['Fresh', 'Marine', 'Green'],
    'Woody': ['Gourmand', 'Sweet', 'Fruity'],
    'Oriental': ['Fresh', 'Marine', 'Green'],
    'Floral': ['Animalic', 'Leather', 'Smoky'],
  },
  HARMONIOUS_PAIRS: {
    'Floral': ['Woody', 'Oriental', 'Spicy', 'Vanilla'],
    'Woody': ['Floral', 'Oriental', 'Spicy', 'Amber'],
    'Oriental': ['Floral', 'Woody', 'Spicy', 'Amber'],
    'Gourmand': ['Woody', 'Oriental', 'Spicy', 'Amber'],
    'Fresh': ['Citrus', 'Green', 'Aquatic'],
    'Citrus': ['Fresh', 'Green', 'Woody'],
  },
  SYNERGISTIC_FAMILIES: [
    ['Floral', 'Oriental'],
    ['Woody', 'Amber'],
    ['Gourmand', 'Vanilla'],
    ['Fresh', 'Citrus'],
    ['Spicy', 'Oriental']
  ]
};

// ------------------------------------------------------------------
// NARRATIVE ENGINE (Template Functions)
// ------------------------------------------------------------------

type NarrativeType = 'FIXER' | 'BRIDGE' | 'CONTRAST' | 'BOOSTER' | 'CLASH' | 'BALANCE';

interface NarrativeContext {
  strong: string; 
  weak: string;   
  p1: string;     
  p2: string;     
  note: string;   
  vibe: string;   
  vibe1: string;  
  vibe2: string;  
}

const NARRATIVE_GENERATORS: Record<NarrativeType, ((ctx: NarrativeContext) => string)[]> = {
  FIXER: [
    ctx => `You love ${ctx.weak}, but it vanishes. ${ctx.strong} fixes that problem without ruining the scent profile.`,
    ctx => `Functionally, ${ctx.strong} acts as the canvas here. It grabs onto ${ctx.weak} and forces it to last hours longer.`,
    ctx => `Think of ${ctx.strong} as a primer. It gives the volatile notes in ${ctx.weak} something substantial to stick to.`,
    ctx => `This is a performance hack. You get the delicate vibe of ${ctx.weak} with the engine of ${ctx.strong} underneath it.`
  ],
  BRIDGE: [
    ctx => `These two lock together because they share a ${ctx.note} note. It feels like one cohesive scent rather than a mix.`,
    ctx => `The shared ${ctx.note} acts as the glue here. It prevents them from smelling disjointed.`,
    ctx => `Seamless blend. The ${ctx.note} in both creates a bridge, so you can't tell where one ends and the other begins.`,
    ctx => `They are practically cousins because of that common ${ctx.note} base. Layering them just creates a 3D version of it.`
  ],
  CONTRAST: [
    ctx => `The Salt & Caramel effect. The ${ctx.vibe1} cuts through the ${ctx.vibe2}, making both sides pop.`,
    ctx => `Opposites attract here. The ${ctx.vibe1} prevents the ${ctx.vibe2} from becoming too boring or linear.`,
    ctx => `This adds a ${ctx.vibe2} edge to your typical ${ctx.vibe1} profile. Unexpected, but it works.`,
    ctx => `It stops ${ctx.p1} from being too linear. The ${ctx.vibe2} facet adds a whole new dimension.`
  ],
  BOOSTER: [
    ctx => `Doubling down. If you want maximum ${ctx.vibe}, this combination is nuclear.`,
    ctx => `This just turns the volume up on the ${ctx.vibe} aspects of the profile.`,
    ctx => `For when you really want to project ${ctx.vibe}. It is intense, but clean.`,
    ctx => `Basically a flanker of the original. Same DNA, just louder and more ${ctx.vibe}.`
  ],
  CLASH: [
    ctx => `Risky. The ${ctx.vibe1} really fights with the ${ctx.vibe2}. Proceed with caution.`,
    ctx => `It is chaotic. You might get moments of brilliance, but mostly it is a battle for dominance.`,
    ctx => `A bit dissonant. The ${ctx.vibe1} notes make the ${ctx.vibe2} smell slightly off.`
  ],
  BALANCE: [
    ctx => `A solid daily driver. Neither scent overpowers the other.`,
    ctx => `Clean and functional. They occupy different frequencies so they don't muddy up.`,
    ctx => `Just a good, safe mix. ${ctx.strong} adds weight while ${ctx.weak} adds air.`
  ]
};

const VERDICTS: Record<NarrativeType, string[]> = {
  FIXER: ["Performance Hack", "The Extender", "Longevity Fix", "Anchor Layer"],
  BRIDGE: ["Seamless Blend", "Perfect Harmony", "The 3D Effect", "Cohesive Mix"],
  CONTRAST: ["Complex Twist", "The Edge", "Bold Choice", "Statement Scent"],
  BOOSTER: ["Beast Mode", "Intense Edition", "Volume Up", "Double Down"],
  CLASH: ["High Risk", "Chaotic", "Dissonant", "Experimental"],
  BALANCE: ["Solid Mix", "Daily Driver", "Safe Bet", "Balanced"]
};

// ------------------------------------------------------------------
// CORE LOGIC
// ------------------------------------------------------------------

export function mixPerfumes(p1: any, p2: any, ratio: number = 0.5) {
  const notes1 = p1.perfume_notes || [];
  const notes2 = p2.perfume_notes || [];
  const vibes1 = p1.vibe_tags || [];
  const vibes2 = p2.vibe_tags || [];
  
  const seed = (p1.name.length + p2.name.length);

  const n1Names = notes1.map((n: any) => n.note?.name || '');
  const n2Names = notes2.map((n: any) => n.note?.name || '');
  
  const bridgeNotes = n1Names.filter((n: string) => n2Names.includes(n) && n !== '');

  const p1Longevity = p1.longevity_rating || 5;
  const p2Longevity = p2.longevity_rating || 5;
  const longevityDiff = Math.abs(p1Longevity - p2Longevity);
  
  let clashCount = 0;
  vibes1.forEach((v1: string) => {
    if (PERFUME_ALCHEMY_RULES.MAJOR_CLASHES[v1]?.some((c: string) => vibes2.includes(c))) clashCount += 2;
    if (PERFUME_ALCHEMY_RULES.MINOR_CLASHES[v1]?.some((c: string) => vibes2.includes(c))) clashCount += 1;
  });

  let synergyCount = 0;
  const combinedVibes = Array.from(new Set([...vibes1, ...vibes2]));
  PERFUME_ALCHEMY_RULES.SYNERGISTIC_FAMILIES.forEach(([f1, f2]) => {
    if (combinedVibes.includes(f1) && combinedVibes.includes(f2)) synergyCount++;
  });

  let narrative: NarrativeType = 'BALANCE'; 
  
  const mainNote = (bridgeNotes[0] || 'base').toLowerCase();
  const mainVibe = (vibes1[0] || 'scent').toLowerCase();
  const v1 = (vibes1[0] || 'base').toLowerCase();
  const v2 = (vibes2[0] || 'accent').toLowerCase();

  if (clashCount >= 3) {
    narrative = 'CLASH';
  } else if (bridgeNotes.length >= 2) {
    narrative = 'BRIDGE';
  } else if (longevityDiff >= 3) {
    narrative = 'FIXER';
  } else if (synergyCount > 0 && vibes1[0] === vibes2[0]) {
    narrative = 'BOOSTER';
  } else if (vibes1[0] !== vibes2[0]) {
    narrative = 'CONTRAST';
  }

  const generatorList = NARRATIVE_GENERATORS[narrative];
  const generateText = generatorList[seed % generatorList.length];
  
  const verdictList = VERDICTS[narrative];
  const verdict = verdictList[seed % verdictList.length];
  
  const strongP = p1Longevity > p2Longevity ? p1 : p2;
  const weakP = p1Longevity > p2Longevity ? p2 : p1;

  const context: NarrativeContext = {
    strong: strongP.name,
    weak: weakP.name,
    p1: p1.name,
    p2: p2.name,
    note: mainNote,
    vibe: mainVibe,
    vibe1: v1,
    vibe2: v2
  };

  const description = generateText(context);

  const mixingTips: string[] = [];
  
  if (narrative === 'FIXER') {
    mixingTips.push(`Apply ${strongP.name} first (2 sprays), let it dry for 30s, then apply ${weakP.name}.`);
  } else if (narrative === 'CLASH') {
    mixingTips.push("Do not spray on the same spot. Spray one on neck, one on wrists to let them mix in the air.");
  } else if (narrative === 'BOOSTER') {
    mixingTips.push("Go easy on the trigger. This mix projects heavily.");
  } else {
    const s1 = p1.sillage_rating || 5;
    const s2 = p2.sillage_rating || 5;
    
    if (s1 > s2 + 2) {
      mixingTips.push(`Use less of ${p1.name} so it doesn't overpower the mix.`);
    } else if (s2 > s1 + 2) {
      mixingTips.push(`Use less of ${p2.name} so it doesn't overpower the mix.`);
    } else {
      mixingTips.push("Safe to apply in a 1:1 ratio.");
    }
  }

  let safety = 85;
  if (narrative === 'CLASH') safety = 45;
  if (narrative === 'BRIDGE' || narrative === 'BOOSTER') safety = 95;
  if (narrative === 'CONTRAST') safety = 75;
  if (narrative === 'FIXER') safety = 90;
  if (narrative === 'BALANCE') safety = 80;

  const getVal = (p: any, key: string) => (p.scent_profile?.[key] || 0);
  const newProfile = {
    fresh: (getVal(p1, 'fresh') + getVal(p2, 'fresh')) / 2,
    sweet: (getVal(p1, 'sweet') + getVal(p2, 'sweet')) / 2,
    spicy: (getVal(p1, 'spicy') + getVal(p2, 'spicy')) / 2,
    woody: (getVal(p1, 'woody') + getVal(p2, 'woody')) / 2,
    floral: (getVal(p1, 'floral') + getVal(p2, 'floral')) / 2,
    depth: (getVal(p1, 'depth') + getVal(p2, 'depth')) / 2,
  };

  return {
    mixName: `${p1.name} + ${p2.name}`,
    narrative,
    safety,
    verdict,
    description,
    mixingTips,
    newProfile,
    bridgeNotes,
    warnings: narrative === 'CLASH' ? ["High risk of dissonance."] : []
  };
}

// ------------------------------------------------------------------
// BATCH PROCESSOR (Restored for Action Compatibility)
// ------------------------------------------------------------------

/**
 * Finds the best layering matches for a base perfume from a list of candidates.
 * Uses the new mixPerfumes logic to evaluate each pair.
 */
export function findLayeringMatches(basePerfume: any, candidates: any[], limit: number = 6) {
  const results = candidates
    .filter(c => c.id !== basePerfume.id)
    .map(candidate => {
      // Generate the mix using the new engine
      const mix = mixPerfumes(basePerfume, candidate);
      
      return {
        perfume: candidate,
        ...mix // Spread the safety, description, verdict, etc.
      };
    })
    // Filter out low safety matches to ensure quality recommendations
    .filter(match => match.safety >= 60) 
    .sort((a, b) => b.safety - a.safety)
    .slice(0, limit);

  return results;
}

// ------------------------------------------------------------------
// INGREDIENT ANALYSIS (Restored for Ingredient Combiner Page)
// ------------------------------------------------------------------

/**
 * Analyzes a list of raw ingredient notes for potential clashes or harmonies.
 * Used by the Ingredient Combiner page.
 */
export function analyzeIngredientCombination(ingredients: any[]) {
  const warnings: string[] = [];
  const tips: string[] = [];
  let hasClash = false;
  let hasHarmony = false;

  // Safety check
  if (!ingredients || ingredients.length === 0) {
    return { warnings, tips, hasClash, hasHarmony };
  }

  // Extract families and normalize to Title Case (e.g. 'floral' -> 'Floral')
  // This matches the keys in PERFUME_ALCHEMY_RULES
  const families = [...new Set(ingredients.map(i => {
    const f = i.family || '';
    return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase();
  }).filter(Boolean))];

  // 1. Check for Clashes
  families.forEach(f1 => {
    if (PERFUME_ALCHEMY_RULES.MAJOR_CLASHES[f1]) {
      const clashes = PERFUME_ALCHEMY_RULES.MAJOR_CLASHES[f1].filter(c => families.includes(c));
      if (clashes.length > 0) {
        hasClash = true;
        clashes.forEach(c => {
          const msg = `The ${f1} notes might clash with the ${c} notes.`;
          if (!warnings.includes(msg)) warnings.push(msg);
        });
      }
    }
  });

  // 2. Check for Harmonies
  families.forEach(f1 => {
    if (PERFUME_ALCHEMY_RULES.HARMONIOUS_PAIRS[f1]) {
      const matches = PERFUME_ALCHEMY_RULES.HARMONIOUS_PAIRS[f1].filter(h => families.includes(h));
      if (matches.length > 0) {
        hasHarmony = true;
        matches.forEach(m => {
          const msg = `${f1} + ${m} is a classic pairing.`;
          if (!tips.includes(msg)) tips.push(msg);
        });
      }
    }
  });

  // 3. Check for Synergy
  PERFUME_ALCHEMY_RULES.SYNERGISTIC_FAMILIES.forEach(pair => {
    if (families.includes(pair[0]) && families.includes(pair[1])) {
      hasHarmony = true;
      const msg = `${pair[0]} and ${pair[1]} enhance each other perfectly.`;
      if (!tips.includes(msg)) tips.push(msg);
    }
  });

  return { warnings, tips, hasClash, hasHarmony };
}

// ------------------------------------------------------------------
// HELPER FOR LEGACY COMPATIBILITY
// ------------------------------------------------------------------
const VOLATILITY_CLASSIFICATION: Record<string, string[]> = {
  Top: ['bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin', 'lime', 'neroli', 'petitgrain', 'lavender', 'rosemary', 'basil', 'mint'],
  Heart: ['rose', 'jasmine', 'ylang ylang', 'tuberose', 'lily', 'carnation', 'iris', 'geranium', 'cinnamon', 'cardamom', 'nutmeg'],
  Base: ['sandalwood', 'cedar', 'patchouli', 'oakmoss', 'vetiver', 'amber', 'vanilla', 'tonka', 'musk', 'leather', 'tobacco', 'oud']
};

export function classifyNoteVolatility(noteName: string): string {
  const name = noteName.toLowerCase();
  for (const [volatility, notes] of Object.entries(VOLATILITY_CLASSIFICATION)) {
    if (notes.some(note => name.includes(note) || note.includes(name))) return volatility;
  }
  return 'Heart';
}