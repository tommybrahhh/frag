export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  description?: string;
  options: QuizOption[];
}

export interface QuizOption {
  label: string;
  value: string;
  personalityTraits?: string[];
  scentPreferences?: string[];
  occasions?: string[];
  intensityProfile?: { min: number; max: number };
  seasonalAffinity?: string[];
  description?: string;
}

export const questions: QuizQuestion[] = [
  {
    id: 'personality',
    question: "Which archetype resonates most with your personality?",
    description: "Your essence speaks before you do. Choose the energy that feels most authentic to you.",
    type: 'single',
    options: [
      {
        label: "The Romantic Dreamer",
        value: "romantic",
        personalityTraits: ['sensitive', 'creative', 'intuitive', 'empathetic'],
        scentPreferences: ['floral', 'sweet', 'vanilla', 'powdery'],
        occasions: ['date', 'intimate', 'special'],
        description: "You lead with your heart and appreciate beauty in all forms"
      },
      {
        label: "The Bold Adventurer",
        value: "adventurous",
        personalityTraits: ['confident', 'spontaneous', 'energetic', 'fearless'],
        scentPreferences: ['spicy', 'woody', 'leather', 'tobacco'],
        occasions: ['nightlife', 'social', 'travel'],
        description: "You crave excitement and aren't afraid to stand out"
      },
      {
        label: "The Sophisticated Classic",
        value: "classic",
        personalityTraits: ['elegant', 'refined', 'discerning', 'timeless'],
        scentPreferences: ['citrus', 'fresh', 'clean', 'musk'],
        occasions: ['professional', 'formal', 'business'],
        description: "You value tradition, quality, and understated elegance"
      },
      {
        label: "The Free Spirit",
        value: "bohemian",
        personalityTraits: ['creative', 'unconventional', 'spiritual', 'natural'],
        scentPreferences: ['herbal', 'earthy', 'incense', 'patchouli'],
        occasions: ['casual', 'creative', 'meditative'],
        description: "You march to your own rhythm and connect with nature"
      }
    ]
  },
  {
    id: 'energy',
    question: "How do you want your scent to make people feel?",
    description: "Fragrance is emotional architecture. What atmosphere do you want to create?",
    type: 'single',
    options: [
      {
        label: "Intrigued and Captivated",
        value: "magnetic",
        scentPreferences: ['mysterious', 'seductive', 'spicy', 'amber'],
        intensityProfile: { min: 4, max: 5 },
        description: "You want to leave a lasting, memorable impression"
      },
      {
        label: "Comforted and At Ease",
        value: "comforting",
        scentPreferences: ['warm', 'sweet', 'vanilla', 'gourmand'],
        intensityProfile: { min: 2, max: 4 },
        description: "You create safe, welcoming spaces wherever you go"
      },
      {
        label: "Energized and Inspired",
        value: "uplifting",
        scentPreferences: ['citrus', 'fresh', 'green', 'aquatic'],
        intensityProfile: { min: 3, max: 4 },
        description: "You bring positive energy and light to every situation"
      },
      {
        label: "Respected and Impressed",
        value: "authoritative",
        scentPreferences: ['woody', 'leather', 'tobacco', 'oud'],
        intensityProfile: { min: 3, max: 5 },
        description: "You command attention through quiet confidence"
      }
    ]
  },
  {
    id: 'lifestyle',
    question: "Which scenario feels most like your daily life?",
    description: "Your scent should complement your world, not compete with it.",
    type: 'single',
    options: [
      {
        label: "Urban Professional",
        value: "urban",
        occasions: ['office', 'meetings', 'networking'],
        seasonalAffinity: ['fall', 'winter'],
        scentPreferences: ['sophisticated', 'clean', 'woody'],
        description: "Skyscrapers, coffee meetings, and power lunches"
      },
      {
        label: "Creative Nomad",
        value: "creative",
        occasions: ['studio', 'cafes', 'galleries'],
        seasonalAffinity: ['spring', 'summer'],
        scentPreferences: ['unique', 'artistic', 'unconventional'],
        description: "Art studios, coffee shops, and spontaneous adventures"
      },
      {
        label: "Nature Lover",
        value: "nature",
        occasions: ['outdoors', 'weekends', 'travel'],
        seasonalAffinity: ['spring', 'summer'],
        scentPreferences: ['earthy', 'green', 'fresh'],
        description: "Hiking trails, beach days, and mountain air"
      },
      {
        label: "Social Butterfly",
        value: "social",
        occasions: ['parties', 'events', 'gatherings'],
        seasonalAffinity: ['all'],
        scentPreferences: ['bold', 'sexy', 'attention-grabbing'],
        description: "Nightlife, celebrations, and making connections"
      }
    ]
  },
  {
    id: 'intimacy',
    question: "How close should someone be to experience your scent?",
    description: "This determines your fragrance's magnetic pull and personal boundary.",
    type: 'single',
    options: [
      {
        label: "Intimate Whisper",
        value: "intimate",
        intensityProfile: { min: 1, max: 2 },
        description: "A secret just for you and those closest to you",
        personalityTraits: ['introverted', 'private', 'thoughtful']
      },
      {
        label: "Conversational Distance",
        value: "moderate",
        intensityProfile: { min: 3, max: 4 },
        description: "Noticeable when someone is within arm's reach",
        personalityTraits: ['balanced', 'social', 'approachable']
      },
      {
        label: "Room Presence",
        value: "bold",
        intensityProfile: { min: 4, max: 5 },
        description: "Your scent announces your arrival before you speak",
        personalityTraits: ['extroverted', 'confident', 'charismatic']
      }
    ]
  },
  {
    id: 'season',
    question: "When does your spirit feel most alive?",
    description: "Our souls have seasonal rhythms. When do you bloom?",
    type: 'single',
    options: [
      {
        label: "Spring Renewal",
        value: "spring",
        seasonalAffinity: ['spring'],
        scentPreferences: ['fresh', 'floral', 'green'],
        description: "New beginnings, blossoming creativity, fresh starts"
      },
      {
        label: "Summer Radiance",
        value: "summer",
        seasonalAffinity: ['summer'],
        scentPreferences: ['citrus', 'aquatic', 'light'],
        description: "Sunshine, energy, vibrant social connections"
      },
      {
        label: "Autumn Depth",
        value: "fall",
        seasonalAffinity: ['fall'],
        scentPreferences: ['spicy', 'woody', 'warm'],
        description: "Transformation, introspection, cozy moments"
      },
      {
        label: "Winter Mystique",
        value: "winter",
        seasonalAffinity: ['winter'],
        scentPreferences: ['amber', 'leather', 'oriental'],
        description: "Magic, intimacy, profound connections"
      },
      {
        label: "Timeless All-Season",
        value: "all",
        seasonalAffinity: ['all'],
        scentPreferences: ['versatile', 'balanced', 'signature'],
        description: "Your essence transcends seasons and trends"
      }
    ]
  },
  {
    id: 'scent_family',
    question: "Which scent family speaks to your soul?",
    description: "Every fragrance has a family. Which one feels like home?",
    type: 'single',
    options: [
      {
        label: "Floral Bouquets",
        value: "floral",
        scentPreferences: ['rose', 'jasmine', 'lily', 'peony', 'violet'],
        personalityTraits: ['romantic', 'feminine', 'graceful'],
        description: "Elegant, romantic, and timeless floral compositions"
      },
      {
        label: "Woody & Earthy",
        value: "woody",
        scentPreferences: ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'oakmoss'],
        personalityTraits: ['grounded', 'earthy', 'authentic'],
        description: "Deep, warm, and nature-connected scents"
      },
      {
        label: "Citrus & Fresh",
        value: "citrus",
        scentPreferences: ['bergamot', 'lemon', 'orange', 'grapefruit', 'neroli'],
        personalityTraits: ['energetic', 'optimistic', 'refreshing'],
        description: "Bright, uplifting, and invigorating aromas"
      },
      {
        label: "Oriental & Spicy",
        value: "oriental",
        scentPreferences: ['vanilla', 'amber', 'cinnamon', 'clove', 'incense'],
        personalityTraits: ['exotic', 'sensual', 'mysterious'],
        description: "Warm, spicy, and luxurious exotic blends"
      },
      {
        label: "Gourmand & Sweet",
        value: "gourmand",
        scentPreferences: ['caramel', 'chocolate', 'coffee', 'honey', 'praline'],
        personalityTraits: ['comforting', 'indulgent', 'playful'],
        description: "Delicious, edible-inspired sweet treats"
      }
    ]
  },
  {
    id: 'longevity',
    question: "How long should your scent journey last?",
    description: "Some fragrances are fleeting moments, others are day-long companions.",
    type: 'single',
    options: [
      {
        label: "Ephemeral Whispers (2-4 hours)",
        value: "short",
        intensityProfile: { min: 1, max: 2 },
        personalityTraits: ['spontaneous', 'versatile', 'fresh'],
        description: "Perfect for quick refresh and versatility throughout the day"
      },
      {
        label: "Daytime Companion (4-8 hours)",
        value: "medium",
        intensityProfile: { min: 3, max: 4 },
        personalityTraits: ['reliable', 'balanced', 'practical'],
        description: "Lasts through work or daily activities without reapplication"
      },
      {
        label: "Signature Sillage (8+ hours)",
        value: "long",
        intensityProfile: { min: 4, max: 5 },
        personalityTraits: ['confident', 'memorable', 'dramatic'],
        description: "Makes a statement that lingers long after you've left"
      },
      {
        label: "Skin Scent Intimacy (varies)",
        value: "intimate",
        intensityProfile: { min: 1, max: 2 },
        personalityTraits: ['personal', 'subtle', 'intimate'],
        description: "Develops uniquely on your skin, discovered only by proximity"
      }
    ]
  },
  {
    id: 'note_preference',
    question: "Which notes make your heart skip a beat?",
    description: "The magic is in the details. Which accords captivate you most?",
    type: 'multiple',
    options: [
      {
        label: "Citrus Zest",
        value: "citrus_notes",
        scentPreferences: ['bergamot', 'lemon', 'mandarin', 'grapefruit'],
        description: "Bright, energizing top notes that sparkle"
      },
      {
        label: "Floral Heart",
        value: "floral_notes",
        scentPreferences: ['rose', 'jasmine', 'ylang-ylang', 'tuberose'],
        description: "Romantic, elegant floral bouquets"
      },
      {
        label: "Woody Base",
        value: "woody_notes",
        scentPreferences: ['sandalwood', 'cedar', 'vetiver', 'patchouli'],
        description: "Deep, grounding foundation notes"
      },
      {
        label: "Spicy Accents",
        value: "spicy_notes",
        scentPreferences: ['cinnamon', 'cardamom', 'pepper', 'nutmeg'],
        description: "Warm, exotic spice blends"
      },
      {
        label: "Gourmand Treats",
        value: "gourmand_notes",
        scentPreferences: ['vanilla', 'caramel', 'chocolate', 'coffee'],
        description: "Sweet, edible-inspired delights"
      },
      {
        label: "Fresh Greens",
        value: "green_notes",
        scentPreferences: ['grass', 'mint', 'tea', 'galbanum'],
        description: "Crisp, natural green accords"
      },
      {
        label: "Aquatic Breezes",
        value: "aquatic_notes",
        scentPreferences: ['sea salt', 'ozone', 'water notes', 'calone'],
        description: "Fresh, marine-inspired scents"
      },
      {
        label: "Leather & Tobacco",
        value: "leather_notes",
        scentPreferences: ['leather', 'tobacco', 'suede', 'birch tar'],
        description: "Sophisticated, classic masculine notes"
      }
    ]
  }
];

export interface QuizAnswers {
  personality?: string;
  energy?: string;
  lifestyle?: string;
  intimacy?: string;
  season?: string;
  scent_family?: string;
  longevity?: string;
  note_preference?: string;
  [key: string]: string | undefined;
}

export interface PersonalityProfile {
  traits: string[];
  scentPreferences: string[];
  occasions: string[];
  intensityRange: { min: number; max: number };
  seasonalAffinity: string[];
}

export function buildPersonalityProfile(answers: QuizAnswers): PersonalityProfile {
  const selectedOptions = questions.flatMap(q => 
    q.options.filter(opt => opt.value === answers[q.id])
  );

  return {
    traits: Array.from(new Set(selectedOptions.flatMap(opt => opt.personalityTraits || []))),
    scentPreferences: Array.from(new Set(selectedOptions.flatMap(opt => opt.scentPreferences || []))),
    occasions: Array.from(new Set(selectedOptions.flatMap(opt => opt.occasions || []))),
    intensityRange: {
      min: Math.max(...selectedOptions.map(opt => opt.intensityProfile?.min || 1)),
      max: Math.min(...selectedOptions.map(opt => opt.intensityProfile?.max || 5))
    },
    seasonalAffinity: Array.from(new Set(selectedOptions.flatMap(opt => opt.seasonalAffinity || [])))
  };
}