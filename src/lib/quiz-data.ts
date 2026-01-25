export interface QuizQuestion {
  id: string;
  question: string;
  subtext?: string;
  type: 'single' | 'multiple';
  layout?: 'grid' | 'cards' | 'list'; // To control UI layout
  options: QuizOption[];
}

export interface QuizOption {
  label: string;
  value: string;
  description?: string;
  // Visuals
  icon?: string; // Icon name (we can map these to Lucide icons in the component)
  color?: string; // CSS color or gradient class
  image?: string; // Path to asset if available
  
  // Mapping logic
  scentFamilies?: string[]; // Floral, Woody, etc.
  notes?: string[]; // Specific notes
  vibes?: string[]; // Romantic, Bold, etc.
  seasons?: string[];
  intensity?: number; // 1-5
  complexity?: 'safe' | 'bold' | 'niche'; // New field for "Wildcard" factor
}

export const questions: QuizQuestion[] = [
  {
    id: 'texture',
    question: "If your aura was a material, what would it feel like?",
    subtext: "Texture maps to the 'weight' and character of the scent.",
    type: 'single',
    layout: 'cards',
    options: [
      {
        label: "Cool Silk",
        value: "silk",
        description: "Fluid, frictionless, and effortlessly elegant.",
        color: "from-pink-100 to-rose-200",
        scentFamilies: ['floral', 'fruity', 'musk'],
        vibes: ['elegant', 'romantic', 'soft'],
        notes: ['rose', 'peony', 'white musk', 'pear'],
        complexity: 'safe'
      },
      {
        label: "Crushed Velvet",
        value: "velvet",
        description: "Deep, dense, and enveloping shadows.",
        color: "from-amber-700 to-purple-900",
        scentFamilies: ['oriental', 'gourmand', 'amber'],
        vibes: ['seductive', 'comforting', 'mysterious'],
        notes: ['vanilla', 'amber', 'tonka', 'oud'],
        complexity: 'bold'
      },
      {
        label: "Raw Linen",
        value: "linen",
        description: "Clean, woven, and perfectly imperfect.",
        color: "from-blue-50 to-slate-200",
        scentFamilies: ['fresh', 'citrus', 'clean'],
        vibes: ['modern', 'minimalist', 'clean'],
        notes: ['bergamot', 'cotton', 'aldehydes', 'neroli'],
        complexity: 'safe'
      },
      {
        label: "Worn Leather",
        value: "leather",
        description: "Warm, lived-in, and tough.",
        color: "from-stone-600 to-stone-800",
        scentFamilies: ['woody', 'leather', 'chypre'],
        vibes: ['bold', 'confident', 'grounded'],
        notes: ['leather', 'cedar', 'tobacco', 'smoke'],
        complexity: 'bold'
      }
    ]
  },
  {
    id: 'escape',
    question: "Where do you go to find yourself?",
    subtext: "The setting defines the atmospheric notes.",
    type: 'single',
    layout: 'cards',
    options: [
      {
        label: "A Forgotten Garden",
        value: "garden",
        description: "Overgrown vines, wet earth, and blooming jasmine.",
        color: "from-green-200 to-emerald-400",
        scentFamilies: ['floral', 'green'],
        vibes: ['romantic', 'natural', 'wild'],
        notes: ['jasmine', 'tuberose', 'green leaves', 'soil'],
        complexity: 'safe'
      },
      {
        label: "An Old Library",
        value: "library",
        description: "Dusty pages, polished wood, and silence.",
        color: "from-amber-900 to-brown-950",
        scentFamilies: ['woody', 'spicy'],
        vibes: ['intellectual', 'introverted', 'nostalgic'],
        notes: ['cedar', 'papyrus', 'leather', 'ink'],
        complexity: 'niche'
      },
      {
        label: "A Stormy Coast",
        value: "ocean",
        description: "Salt spray, grey skies, and driftwood.",
        color: "from-cyan-700 to-slate-600",
        scentFamilies: ['aquatic', 'marine', 'woody'],
        vibes: ['melancholic', 'adventurous', 'intense'],
        notes: ['sea salt', 'driftwood', 'ambergris', 'seaweed'],
        complexity: 'niche'
      },
      {
        label: "A Night Market",
        value: "market",
        description: "Incense smoke, exotic spices, and heat.",
        color: "from-orange-500 to-red-700",
        scentFamilies: ['oriental', 'spicy'],
        vibes: ['exotic', 'bold', 'sensual'],
        notes: ['incense', 'cinnamon', 'saffron', 'cardamom'],
        complexity: 'bold'
      }
    ]
  },
  {
    id: 'complexity',
    question: "How do you want to be challenged?",
    subtext: "This determines how 'niche' or artistic the recommendations will be.",
    type: 'single',
    layout: 'list',
    options: [
      {
        label: "Pure Pleasure (Safe)",
        value: "safe",
        description: "I want to smell amazing, clean, and universally appealing.",
        color: "border-green-200",
        complexity: 'safe',
        vibes: ['approachable', 'pleasant']
      },
      {
        label: "Make a Statement (Bold)",
        value: "bold",
        description: "I want to be noticed. Give me intensity and character.",
        color: "border-amber-300",
        complexity: 'bold',
        vibes: ['confident', 'sexy']
      },
      {
        label: "Olfactory Art (Niche)",
        value: "niche",
        description: "I want to be transported. I love weird, earthy, or polarizing scents.",
        color: "border-purple-400",
        complexity: 'niche',
        vibes: ['unique', 'artistic', 'challenging']
      }
    ]
  },
  {
    id: 'drink',
    question: "Pick your poison.",
    subtext: "Taste preferences often mirror olfactory ones.",
    type: 'single',
    layout: 'grid',
    options: [
      {
        label: "Gin & Tonic",
        value: "citrus",
        description: "Botanical, crisp, and bitter.",
        color: "bg-blue-50",
        notes: ['juniper', 'lime', 'gin', 'cucumber']
      },
      {
        label: "Espresso",
        value: "bitter",
        description: "Dark, roasted, and intense.",
        color: "bg-stone-800 text-stone-100",
        notes: ['coffee', 'cacao', 'roasted notes']
      },
      {
        label: "Earl Grey Tea",
        value: "herbal",
        description: "Aromatic, comforting, and refined.",
        color: "bg-stone-200",
        notes: ['tea', 'bergamot', 'lavender']
      },
      {
        label: "Aged Whiskey",
        value: "boozy",
        description: "Smoky, woody, and warm.",
        color: "bg-amber-800 text-amber-100",
        notes: ['rum', 'cognac', 'oak', 'peat']
      },
      {
        label: "Iced Water",
        value: "fresh",
        description: "Minimalist and pure.",
        color: "bg-cyan-50",
        notes: ['water notes', 'musk', 'ambroxan']
      },
      {
        label: "Spiced Chai",
        value: "spicy",
        description: "Milky, sweet, and spicy.",
        color: "bg-orange-100",
        notes: ['ginger', 'cinnamon', 'cardamom', 'milk']
      }
    ]
  },
  {
    id: 'palette',
    question: "What colors dominates your closet?",
    subtext: "Visual aesthetics correlate with scent families.",
    type: 'single',
    layout: 'grid',
    options: [
      {
        label: "All Black",
        value: "noir",
        color: "bg-stone-900 text-stone-100",
        vibes: ['mysterious', 'modern', 'chic'],
        complexity: 'bold'
      },
      {
        label: "Neutrals & Beige",
        value: "neutral",
        color: "bg-[#e5e0d8]",
        vibes: ['clean', 'minimalist', 'soft'],
        complexity: 'safe'
      },
      {
        label: "Jewel Tones",
        value: "jewel",
        color: "bg-emerald-800 text-emerald-100",
        vibes: ['rich', 'luxurious', 'deep'],
        complexity: 'bold'
      },
      {
        label: "Pastels",
        value: "pastel",
        color: "bg-pink-100",
        vibes: ['dreamy', 'playful', 'sweet'],
        complexity: 'safe'
      }
    ]
  },
  {
    id: 'protagonist',
    question: "In the movie of your life, what is the character's energy?",
    subtext: "A subtle way to find your gender preference.",
    type: 'single',
    layout: 'list',
    options: [
      {
        label: "The Ethereal Muse (Feminine)",
        value: "feminine",
        description: "Soft, graceful, and intuitive energy.",
        color: "border-pink-200"
      },
      {
        label: "The Stoic Hero (Masculine)",
        value: "masculine",
        description: "Grounded, reliable, and strong energy.",
        color: "border-slate-300"
      },
      {
        label: "The Enigmatic Outsider (Unisex)",
        value: "unisex",
        description: "Fluid, mysterious, and undefined energy.",
        color: "border-purple-200"
      }
    ]
  }
];

export interface QuizAnswers {
  [key: string]: string | undefined;
}

export interface PersonalityProfile {
  vibes: string[];
  scentFamilies: string[];
  notes: string[];
  seasons: string[];
  intensityRange: { min: number; max: number };
  complexityPreference: 'safe' | 'bold' | 'niche';
  archetype: string;
}

export function buildPersonalityProfile(answers: QuizAnswers): PersonalityProfile {
  const selectedOptions = questions.flatMap(q => 
    q.options.filter(opt => opt.value === answers[q.id])
  );

  const vibes = Array.from(new Set(selectedOptions.flatMap(opt => opt.vibes || [])));
  const scentFamilies = Array.from(new Set(selectedOptions.flatMap(opt => opt.scentFamilies || [])));
  const notes = Array.from(new Set(selectedOptions.flatMap(opt => opt.notes || [])));
  const seasons = Array.from(new Set(selectedOptions.flatMap(opt => opt.seasons || [])));
  
  // Determine Complexity Preference
  // If explicitly asked (id='complexity'), use that. Otherwise infer from average.
  const explicitComplexity = selectedOptions.find(o => o.value === answers['complexity'])?.complexity;
  let complexityPreference: 'safe' | 'bold' | 'niche' = explicitComplexity || 'safe';
  
  // Calculate Archetype
  const textureVal = answers['texture'];
  const escapeVal = answers['escape'];
  
  let archetype = "The Modern Spirit";
  
  if (textureVal === 'silk' && escapeVal === 'garden') archetype = "The Ethereal Naturalist";
  else if (textureVal === 'velvet' && escapeVal === 'library') archetype = "The Dark Academic";
  else if (textureVal === 'leather' && escapeVal === 'market') archetype = "The Urban Nomad";
  else if (textureVal === 'linen' && escapeVal === 'ocean') archetype = "The Coastal Minimalist";
  else if (textureVal === 'velvet' && escapeVal === 'market') archetype = "The Midnight Siren";
  else if (textureVal === 'silk' && escapeVal === 'library') archetype = "The Quiet Intellectual";
  else if (textureVal === 'linen' && escapeVal === 'garden') archetype = "The Sunlit Optimist";
  else if (escapeVal === 'ocean' && textureVal === 'leather') archetype = "The Storm Chaser";
  else if (complexityPreference === 'niche') archetype = "The Avant-Garde Soul";
  else {
      const adj = vibes[0] ? vibes[0].charAt(0).toUpperCase() + vibes[0].slice(1) : "Mysterious";
      const noun = scentFamilies[0] ? scentFamilies[0].charAt(0).toUpperCase() + scentFamilies[0].slice(1) : "Soul";
      archetype = `The ${adj} ${noun}`;
  }

  return {
    vibes,
    scentFamilies,
    notes,
    seasons,
    intensityRange: { min: 1, max: 5 }, // Simplified for now
    complexityPreference,
    archetype
  };
}