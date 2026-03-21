// Engine for matching quiz answers to perfumes
import { QuizAnswers, buildPersonalityProfile, PersonalityProfile } from './quiz-data';

export interface Perfume {
  id: string;
  name: string;
  image_url: string | null;
  slug: string | null;
  brand_name: string;
  brand_tier?: string; // 'Niche' | 'Designer'
  gender: string;
  sillage_rating: number;
  vibe_tags?: string[];
  occasions?: string[];
  best_season?: string[];
  scent_profile?: Record<string, number>;
  perfume_notes?: Array<{ note: { name: string } }>;
}

export interface Recommendation {
  perfume: Perfume;
  score: number;
  matchReason: string; // Dynamic "Why"
  matchType: 'top' | 'switch' | 'discovery';
}

// Hardcoded Niche List for heuristic detection (fallback if brand_tier is missing)
const NICHE_BRANDS = [
  'Nasomatto', 'Orto Parisi', 'Etat Libre d\'Orange', 'By Kilian', 'Kilian',
  'Frederic Malle', 'Le Labo', 'Maison Crivelli', 'Amouage', 'Xerjoff',
  'Mancera', 'Montale', 'BDK Parfums', 'Serge Lutens', 'Zoologist', 
  'Tauer Perfumes', 'Nishane', 'Penhaligon\'s', 'Creed', 'Parfums de Marly',
  'Maison Francis Kurkdjian', 'Diptyque', 'Byredo', 'Memo Paris', 'Roja Dove',
  'Vilhelm Parfumerie', 'Ds & Durga'
];

const CHALLENGING_NOTES = [
  'oud', 'civet', 'castoreum', 'leather', 'tobacco', 'incense', 'smoke', 
  'birch tar', 'cumin', 'animal notes', 'soil', 'truffle', 'ink', 'ash', 'metallic'
];

/**
 * GENERATE NARRATIVE REASON
 * Connects specific user choices (Texture, Escape, Palette, Drink) to perfume attributes.
 * Uses a dynamic "Strategy Pattern" to create bespoke, non-robotic descriptions.
 */
function generateAlchemyReason(answers: QuizAnswers, perfume: Perfume, profile: PersonalityProfile): string {
  const pNotes = perfume.perfume_notes?.map(n => n.note?.name.toLowerCase()).filter((n): n is string => !!n) || [];
  const pVibes = perfume.vibe_tags?.map(v => v.toLowerCase()) || [];
  
  // Helper to pick random template
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // --- 1. DATA EXTRACTION & ANALYSIS ---
  
  // Find note matches for specific categories
  const drinkNotes = {
    'citrus': ['lime', 'lemon', 'bergamot', 'gin', 'juniper'],
    'bitter': ['coffee', 'cacao', 'patchouli', 'leather'],
    'herbal': ['tea', 'mint', 'lavender', 'sage', 'thyme'],
    'boozy': ['rum', 'cognac', 'whiskey', 'tobacco', 'oak'],
    'fresh': ['water', 'sea', 'salt', 'cucumber', 'melon'],
    'spicy': ['cinnamon', 'ginger', 'cardamom', 'clove', 'pepper']
  };

  const paletteVibes = {
    'noir': ['dark', 'smoky', 'leather', 'wood', 'intense'],
    'neutral': ['clean', 'musk', 'skin', 'soft', 'minimal'],
    'jewel': ['rich', 'amber', 'rose', 'oud', 'opulent'],
    'pastel': ['floral', 'sweet', 'fruit', 'light', 'air']
  };

  // Check for specific attribute matches
  const drinkMatch = answers.drink ? pNotes.find(n => drinkNotes[answers.drink as keyof typeof drinkNotes]?.some(dn => n.includes(dn))) : null;
  const paletteMatch = answers.palette ? pVibes.find(v => paletteVibes[answers.palette as keyof typeof paletteVibes]?.some(pv => v.includes(pv))) : null;
  
  // Find best anchor note (Prioritize Drink match -> Profile match -> First note)
  const anchorNote = (drinkMatch || pNotes.find(n => profile.notes.some(pn => n.includes(pn))) || pNotes[0] || 'heart notes');
  const anchorNoteFmt = anchorNote.charAt(0).toUpperCase() + anchorNote.slice(1);

  // --- 2. NARRATIVE STRATEGIES ---

  // Strategy A: The Sensory Bridge (Texture + Note)
  // Connects the tactile feel (Texture) to the olfactory ingredient.
  const sensoryTemplates = {
    'velvet': [
      `Deep and wrapping, the ${anchorNoteFmt} note mirrors your taste for plush velvet textures.`,
      `A scent with weight and warmth, grounded by rich ${anchorNoteFmt}.`,
      `Luxurious and dense, evoking the heavy drape of velvet.`
    ],
    'silk': [
      `Frictionless and airy, with ${anchorNoteFmt} adding a sheer, silken quality.`,
      `It slips over the skin like cool silk, led by delicate ${anchorNoteFmt}.`,
      `Effortless elegance defined by a translucent ${anchorNoteFmt} accord.`
    ],
    'linen': [
      `Crisp as fresh-pressed linen, centered around a clean ${anchorNoteFmt} core.`,
      `Uncomplicated and bright, capturing the structure of woven fabric.`,
      `A study in composure, using ${anchorNoteFmt} to create a clean silhouette.`
    ],
    'leather': [
      `Worn-in and tactile, the ${anchorNoteFmt} gives this scent a rugged, vintage character.`,
      `Grounded and raw, reflecting the durability of leather through ${anchorNoteFmt}.`,
      `A scent with a story, marked by the deep resonance of ${anchorNoteFmt}.`
    ]
  };

  // Strategy B: The Atmospheric Match (Escape + Vibe)
  // Connects the place (Escape) to the mood (Vibe/Palette).
  const atmosphericTemplates = {
    'garden': [
      `A ${paletteMatch || 'natural'} sanctuary alive with ${anchorNoteFmt}, just like your hidden garden.`,
      `Photorealistic and untamed, capturing the scent of crushed stems and ${anchorNoteFmt}.`,
      `It breathes with the life of a garden after rain.`
    ],
    'library': [
      `Quietly sophisticated, evoking dust motes and ${anchorNoteFmt} in an old library.`,
      `Introspective and warm, perfect for moments of solitude.`,
      `A scent of paper and polished wood, anchored by dry ${anchorNoteFmt}.`
    ],
    'ocean': [
      `Wild and saline, carrying the brace of the Atlantic through ${anchorNoteFmt}.`,
      `Vast and melancholic, mirroring the grey skies of a storm.`,
      `Salt-spray captured in a bottle, with a heart of ${anchorNoteFmt}.`
    ],
    'market': [
      `Chaotic and beautiful, clashing ${anchorNoteFmt} with spices for a bold effect.`,
      `Electric energy bottled, reminiscent of a bustling night market.`,
      `Sensual and overloaded, just like the heat of the bazaar.`
    ]
  };

  // Strategy C: The Persona Echo (Archetype + Palette)
  // Connects the User's "Vibe" to the perfume's character.
  const personaTemplates = [
    `Ideally suited for your '${profile.archetype}' profile, balancing ${answers.complexity} intensity with ${anchorNoteFmt}.`,
    `A signature for the ${answers.palette} aesthetic: ${paletteMatch ? 'undeniably ' + paletteMatch : 'distinctive'} and driven by ${anchorNoteFmt}.`,
    `It speaks the same language as your style—${answers.palette === 'noir' ? 'shadowy' : answers.palette === 'jewel' ? 'opulent' : 'refined'} and memorable.`
  ];

  // --- 3. SELECTION LOGIC ---
  
  // If we have a direct "Drink" connection (synesthesia), prioritize it.
  if (drinkMatch) {
    return pick([
      `The ${anchorNoteFmt} note hits the same spot as your favorite ${answers.drink} drink—${answers.drink === 'citrus' ? 'sharp and icy' : answers.drink === 'boozy' ? 'warm and intoxicating' : 'rich and awakening'}.`,
      `A sensory parallel to your taste in drinks: ${anchorNoteFmt} provides the ${answers.drink === 'spicy' ? 'kick' : 'depth'} you enjoy.`,
      `Just like a ${answers.drink === 'coffee' ? 'double espresso' : 'good gin'}, this is built on a strong ${anchorNoteFmt} foundation.`
    ]);
  }

  // Otherwise, rotate based on what data is strongest
  const strategies = [];
  
  // Add Sensory Strategy if we have a texture map
  if (answers.texture && sensoryTemplates[answers.texture as keyof typeof sensoryTemplates]) {
    strategies.push(...sensoryTemplates[answers.texture as keyof typeof sensoryTemplates]);
  }
  
  // Add Atmospheric Strategy if we have an escape map
  if (answers.escape && atmosphericTemplates[answers.escape as keyof typeof atmosphericTemplates]) {
    strategies.push(...atmosphericTemplates[answers.escape as keyof typeof atmosphericTemplates]);
  }

  // Add Persona Strategy (Always available)
  strategies.push(...personaTemplates);

  // Return a random pick from the assembled valid strategies
  return pick(strategies);
}

export function getRecommendations(answers: QuizAnswers, allPerfumes: Perfume[]): {
  topMatches: Recommendation[];
  possibleSwitches: Recommendation[];
  newDiscoveries: Recommendation[];
} {
  const profile = buildPersonalityProfile(answers);
  
  const allScoredPerfumes = allPerfumes
    .map((perfume) => {
      let score = 0;

      // --- BRAND TIER DETECTION ---
      // Use DB field if available, else heuristic
      const isNiche = perfume.brand_tier === 'Niche' || NICHE_BRANDS.some(b => 
        perfume.brand_name?.toLowerCase().includes(b.toLowerCase())
      );
      
      const hasChallengingNotes = perfume.perfume_notes?.some(n => 
        n.note?.name && CHALLENGING_NOTES.some(cn => n.note.name.toLowerCase().includes(cn))
      );

      // --- 1. THE MANDATE (Niche vs Safe) ---
      if (profile.complexityPreference === 'niche') {
        if (isNiche) {
          score += 40; // MANDATE: Reward Niche heavily
        } else {
          score -= 40; // MANDATE: Penalize Designer heavily (unless it's amazing otherwise)
        }
        if (hasChallengingNotes) score += 15;
        
      } else if (profile.complexityPreference === 'safe') {
        if (hasChallengingNotes) score -= 30; // Safety First
        if (!isNiche) score += 20; // Prefer Designer familiarity
        if (isNiche) score -= 10; // Niche can be risky for 'safe' users
      } else {
        // 'bold'
        if (perfume.sillage_rating > 3.8) score += 25; // Sillage Kings
        score += 10; // Baseline boost
      }

      // --- 2. VIBE SYNERGY (The Soul) ---
      const pVibes = perfume.vibe_tags?.map(v => v.toLowerCase()) || [];
      const userVibes = profile.vibes.map(v => v.toLowerCase());
      
      const sharedVibes = pVibes.filter(tag => userVibes.some(uv => tag.includes(uv)));
      score += sharedVibes.length * 15;

      // --- 3. SCENT FAMILY (The Foundation) ---
      const pFamilies = perfume.vibe_tags || []; // Assuming tags contain families too
      const userFamilies = profile.scentFamilies;
      
      const sharedFamilies = pFamilies.filter(tag => 
        userFamilies.some(uf => tag.toLowerCase().includes(uf.toLowerCase()))
      );
      // Double points for family match as it's fundamental
      score += sharedFamilies.length * 20; 

      // --- 4. GENDER ALIGNMENT ---
      if (answers.protagonist) {
        const pGender = perfume.gender?.toLowerCase() || 'unisex';
        const userGender = answers.protagonist; // feminine, masculine, unisex

        if (userGender === 'unisex') {
           if (pGender.includes('unisex') || pGender.includes('shared')) score += 15;
           else score += 5; // Open to all, but preference for unisex labeling
        } else {
           // Mapping: 'feminine' -> 'female'/'women'
           const target = userGender === 'feminine' ? ['female', 'women', 'feminine'] : ['male', 'men', 'masculine'];
           const isDirectMatch = target.some(t => pGender.includes(t));
           
           if (isDirectMatch) score += 25;
           else if (pGender.includes('unisex')) score += 10; // Unisex is always a valid fallback
           else score -= 40; // Hard mismatch (e.g., Male scent for Feminine user)
        }
      }

      // --- 5. NOTE MATCHING ---
      if (perfume.perfume_notes && profile.notes.length > 0) {
        const matchingNotes = perfume.perfume_notes.filter(n =>
          n.note && profile.notes.some(pn => n.note.name.toLowerCase().includes(pn.toLowerCase()))
        );
        score += matchingNotes.length * 8;
      }

      // Generate the narrative reason
      const reason = generateAlchemyReason(answers, perfume, profile);

      return {
        perfume,
        score: Math.max(0, score),
        matchReason: reason,
        matchType: 'top' // placeholder, assigned later
      } as Recommendation;
    })
    .sort((a, b) => b.score - a.score);

  // --- DIVERSITY & CATEGORIZATION ---
  
  const topMatches: Recommendation[] = [];
  const possibleSwitches: Recommendation[] = [];
  const newDiscoveries: Recommendation[] = [];
  
  const usedBrands = new Set<string>();
  const usedIds = new Set<string>();

  // 1. Fill Top Matches (Max 3, Unique Brands)
  for (const rec of allScoredPerfumes) {
    if (topMatches.length >= 3) break;

    const brand = rec.perfume.brand_name;
    // Diversity Rule: Only 1 per brand in Top 3 (unless we run out of options)
    if (!usedBrands.has(brand)) {
      rec.matchType = 'top';
      topMatches.push(rec);
      usedBrands.add(brand);
      usedIds.add(rec.perfume.id);
    }
  }

  // Fallback: If strict diversity yielded < 3, fill with best available regardless of brand
  if (topMatches.length < 3) {
    for (const rec of allScoredPerfumes) {
      if (topMatches.length >= 3) break;
      if (!usedIds.has(rec.perfume.id)) {
        rec.matchType = 'top';
        topMatches.push(rec);
        usedIds.add(rec.perfume.id);
        // We don't add to usedBrands here to avoid blocking switches
      }
    }
  }

  // 2. Fill Switches (Similar Vibe, can repeat brand if necessary but prefer not to)
  for (const rec of allScoredPerfumes) {
    if (possibleSwitches.length >= 3) break;
    if (usedIds.has(rec.perfume.id)) continue;

    // Logic: High score but missed the cut (or was same brand)
    // We relax the brand rule slightly for switches, but still nice to avoid duplicates
    rec.matchType = 'switch';
    // We preserve the dynamic matchReason generated earlier
    possibleSwitches.push(rec);
    usedIds.add(rec.perfume.id);
  }

  // 3. Fill Discoveries (Different Vibe/Wildcards)
  // We look for things that scored decently (top 50%) but might have a different 'vibe' tag
  // For simplicity in this iteration, we take the next best available to ensure quality.
  for (const rec of allScoredPerfumes) {
    if (newDiscoveries.length >= 3) break;
    if (usedIds.has(rec.perfume.id)) continue;

    rec.matchType = 'discovery';
    // We preserve the dynamic matchReason generated earlier
    newDiscoveries.push(rec);
    usedIds.add(rec.perfume.id);
  }

  return {
    topMatches,
    possibleSwitches,
    newDiscoveries
  };
}

export function getPreferenceSummary(answers: QuizAnswers): string {
    const profile = buildPersonalityProfile(answers);
    return `${profile.archetype}`;
}
