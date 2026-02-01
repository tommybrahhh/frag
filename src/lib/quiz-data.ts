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
    question: "If your signature scent were a fabric, what would it feel like against your skin?",
    subtext: "Scent has a texture. Which one speaks to you?",
    type: 'single',
    layout: 'cards',
    options: [
      {
        label: "Cool, Slipping Silk",
        value: "silk",
        description: "Effortless, airy, and barely there.",
        color: "from-pink-100 to-rose-200",
        scentFamilies: ['floral', 'fruity', 'musk'],
        vibes: ['elegant', 'romantic', 'soft'],
        notes: ['rose', 'peony', 'white musk', 'pear'],
        complexity: 'safe'
      },
      {
        label: "Heavy, Crushed Velvet",
        value: "velvet",
        description: "Deep, wrapping, and luxurious.",
        color: "from-amber-700 to-purple-900",
        scentFamilies: ['oriental', 'gourmand', 'amber'],
        vibes: ['seductive', 'comforting', 'mysterious'],
        notes: ['vanilla', 'amber', 'tonka', 'oud'],
        complexity: 'bold'
      },
      {
        label: "Fresh-Pressed Linen",
        value: "linen",
        description: "Clean, bright, and uncomplicated.",
        color: "from-blue-50 to-slate-200",
        scentFamilies: ['fresh', 'citrus', 'clean'],
        vibes: ['modern', 'minimalist', 'clean'],
        notes: ['bergamot', 'cotton', 'aldehydes', 'neroli'],
        complexity: 'safe'
      },
      {
        label: "Worn, Vintage Leather",
        value: "leather",
        description: "Rugged, warm, and full of character.",
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
    question: "It’s a rare day with absolutely zero plans. Where do you go?",
    subtext: "Let's find the atmosphere that centers you.",
    type: 'single',
    layout: 'cards',
    options: [
      {
        label: "A Hidden, Overgrown Garden",
        value: "garden",
        description: "Dewy petals, wet earth, and fresh air.",
        color: "from-green-200 to-emerald-400",
        scentFamilies: ['floral', 'green'],
        vibes: ['romantic', 'natural', 'wild'],
        notes: ['jasmine', 'tuberose', 'green leaves', 'soil'],
        complexity: 'safe'
      },
      {
        label: "A Quiet Corner in an Old Library",
        value: "library",
        description: "Dusty pages, polished wood, and silence.",
        color: "from-amber-900 to-brown-950",
        scentFamilies: ['woody', 'spicy'],
        vibes: ['intellectual', 'introverted', 'nostalgic'],
        notes: ['cedar', 'papyrus', 'leather', 'ink'],
        complexity: 'niche'
      },
      {
        label: "A Cliffside Overlooking a Stormy Sea",
        value: "ocean",
        description: "Salt spray, grey skies, and raw power.",
        color: "from-cyan-700 to-slate-600",
        scentFamilies: ['aquatic', 'marine', 'woody'],
        vibes: ['melancholic', 'adventurous', 'intense'],
        notes: ['sea salt', 'driftwood', 'ambergris', 'seaweed'],
        complexity: 'niche'
      },
      {
        label: "A Bustling Night Market Abroad",
        value: "market",
        description: "Exotic spices, incense smoke, and electric energy.",
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
    question: "When you walk out the door, what vibe are you aiming for?",
    subtext: "How loud should your fragrance speak?",
    type: 'single',
    layout: 'list',
    options: [
      {
        label: "Effortlessly Pleasant",
        value: "safe",
        description: "I want to smell good, but not overpowering. Just a nice aura.",
        color: "border-green-200",
        complexity: 'safe',
        vibes: ['approachable', 'pleasant']
      },
      {
        label: "Unapologetically Bold",
        value: "bold",
        description: "I want a scent that announces my arrival and lingers after I leave.",
        color: "border-amber-300",
        complexity: 'bold',
        vibes: ['confident', 'sexy']
      },
      {
        label: "Mysteriously Intriguing",
        value: "niche",
        description: "I prefer scents that make people ask, 'Wait, what is that?'",
        color: "border-purple-400",
        complexity: 'niche',
        vibes: ['unique', 'artistic', 'challenging']
      }
    ]
  },
  {
    id: 'drink',
    question: "Pick a drink for the evening. Don't overthink it.",
    subtext: "Our sense of smell and taste are deeply connected.",
    type: 'single',
    layout: 'grid',
    options: [
      {
        label: "Gin & Tonic",
        value: "citrus",
        description: "Sharp, botanical, and icy cold.",
        color: "bg-blue-50",
        notes: ['juniper', 'lime', 'gin', 'cucumber']
      },
      {
        label: "Double Espresso",
        value: "bitter",
        description: "Rich, bitter, and awakening.",
        color: "bg-stone-800 text-stone-100",
        notes: ['coffee', 'cacao', 'roasted notes']
      },
      {
        label: "Hot Earl Grey Tea",
        value: "herbal",
        description: "Steaming, bergamot-infused, and calming.",
        color: "bg-stone-200",
        notes: ['tea', 'bergamot', 'lavender']
      },
      {
        label: "Aged Whiskey",
        value: "boozy",
        description: "Smooth, smoky, and warming.",
        color: "bg-amber-800 text-amber-100",
        notes: ['rum', 'cognac', 'oak', 'peat']
      },
      {
        label: "Ice Water with Lemon",
        value: "fresh",
        description: "Pure, hydrating, and essential.",
        color: "bg-cyan-50",
        notes: ['water notes', 'musk', 'ambroxan']
      },
      {
        label: "Spiced Chai Latte",
        value: "spicy",
        description: "Creamy, sweet, and full of spice.",
        color: "bg-orange-100",
        notes: ['ginger', 'cinnamon', 'cardamom', 'milk']
      }
    ]
  },
  {
    id: 'palette',
    question: "If we opened your wardrobe right now, what color story would we see?",
    subtext: "Your visual style often mirrors your scent profile.",
    type: 'single',
    layout: 'grid',
    options: [
      {
        label: "Monochrome & Black",
        value: "noir",
        color: "bg-stone-900 text-stone-100",
        vibes: ['mysterious', 'modern', 'chic'],
        complexity: 'bold'
      },
      {
        label: "Soft Neutrals & Whites",
        value: "neutral",
        color: "bg-[#e5e0d8]",
        vibes: ['clean', 'minimalist', 'soft'],
        complexity: 'safe'
      },
      {
        label: "Deep Jewel Tones",
        value: "jewel",
        color: "bg-emerald-800 text-emerald-100",
        vibes: ['rich', 'luxurious', 'deep'],
        complexity: 'bold'
      },
      {
        label: "Light Pastels",
        value: "pastel",
        color: "bg-pink-100",
        vibes: ['dreamy', 'playful', 'sweet'],
        complexity: 'safe'
      }
    ]
  },
  {
    id: 'protagonist',
    question: "Finally, what kind of fragrance profile do you generally lean towards?",
    subtext: "No wrong answers, just a starting point.",
    type: 'single',
    layout: 'list',
    options: [
      {
        label: "Traditionally Feminine",
        value: "feminine",
        description: "Florals, fruits, and softer notes.",
        color: "border-pink-200"
      },
      {
        label: "Traditionally Masculine",
        value: "masculine",
        description: "Woods, spices, and aromatic notes.",
        color: "border-slate-300"
      },
      {
        label: "Modern & Unisex",
        value: "unisex",
        description: "Anything goes—I wear what smells good.",
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