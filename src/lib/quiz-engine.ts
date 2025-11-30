import { QuizAnswers, buildPersonalityProfile, PersonalityProfile } from './quiz-data';

export interface Perfume {
  id: string;
  name: string;
  image_url: string | null;
  brand_name: string;
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
  matchReason: string;
  personalityMatch: string[];
}

export function getRecommendations(answers: QuizAnswers, allPerfumes: Perfume[]): Recommendation[] {
  const profile = buildPersonalityProfile(answers);
  
  return allPerfumes
    .map((perfume) => {
      let score = 0;
      let reasons: string[] = [];
      let personalityMatches: string[] = [];

      // 1. PERSONALITY TRAIT MATCHING (Core Identity)
      const personalityMatchScore = calculatePersonalityMatch(perfume, profile);
      score += personalityMatchScore;
      if (personalityMatchScore > 0) {
        personalityMatches.push("Matches your essence");
        reasons.push("Resonates with your core personality");
      }

      // 2. SCENT PREFERENCE MATCHING (Emotional Connection)
      const scentMatchScore = calculateScentPreferenceMatch(perfume, profile);
      score += scentMatchScore;
      if (scentMatchScore > 0) {
        reasons.push("Aligns with your scent preferences");
      }

      // 3. OCCASION MATCHING (Lifestyle Fit)
      const occasionMatchScore = calculateOccasionMatch(perfume, profile);
      score += occasionMatchScore;
      if (occasionMatchScore > 0) {
        reasons.push("Perfect for your lifestyle");
      }

      // 4. INTENSITY MATCHING (Personal Boundaries)
      const intensityMatchScore = calculateIntensityMatch(perfume, profile);
      score += intensityMatchScore;
      if (intensityMatchScore > 0) {
        reasons.push("Matches your desired presence level");
      }

      // 5. SEASONAL AFFINITY (Natural Rhythm)
      const seasonMatchScore = calculateSeasonMatch(perfume, profile);
      score += seasonMatchScore;
      if (seasonMatchScore > 0) {
        reasons.push("Complements your seasonal energy");
      }

      // 6. GENDER COMPATIBILITY (Optional Filter)
      if (answers.personality) {
        const archetype = getArchetypeGenderPreference(answers.personality);
        if (archetype && perfume.gender !== 'Unisex' && perfume.gender !== archetype) {
          score -= 50; // Significant penalty for gender mismatch with archetype
        }
      }

      return { 
        perfume, 
        score: Math.max(0, score), 
        matchReason: reasons[0] || "Good potential match",
        personalityMatch: personalityMatches
      };
    })
    .filter((p) => p.score > 20) // Minimum threshold for meaningful matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function calculatePersonalityMatch(perfume: Perfume, profile: PersonalityProfile): number {
  let score = 0;
  
  // Check vibe tags against personality traits
  if (perfume.vibe_tags && profile.traits.length > 0) {
    const matchingTraits = perfume.vibe_tags.filter(tag => 
      profile.traits.some(trait => tag.toLowerCase().includes(trait.toLowerCase()))
    );
    score += matchingTraits.length * 15;
  }

  // Bonus for perfumes that match multiple personality aspects
  if (score > 0) {
    score += 10;
  }

  return score;
}

function calculateScentPreferenceMatch(perfume: Perfume, profile: PersonalityProfile): number {
  let score = 0;
  
  // Check vibe tags against scent preferences
  if (perfume.vibe_tags && profile.scentPreferences.length > 0) {
    const matchingScents = perfume.vibe_tags.filter(tag =>
      profile.scentPreferences.some(pref => tag.toLowerCase().includes(pref.toLowerCase()))
    );
    score += matchingScents.length * 20;
  }

  // Check perfume notes if available
  if (perfume.perfume_notes && profile.scentPreferences.length > 0) {
    const noteMatches = perfume.perfume_notes.filter(note =>
      profile.scentPreferences.some(pref => 
        note.note.name.toLowerCase().includes(pref.toLowerCase())
      )
    ).length;
    score += noteMatches * 15;
  }

  return score;
}

function calculateOccasionMatch(perfume: Perfume, profile: PersonalityProfile): number {
  let score = 0;
  
  if (perfume.occasions && profile.occasions.length > 0) {
    const matchingOccasions = perfume.occasions.filter(occasion =>
      profile.occasions.some(pref => occasion.toLowerCase().includes(pref.toLowerCase()))
    );
    score += matchingOccasions.length * 25;
  }

  return score;
}

function calculateIntensityMatch(perfume: Perfume, profile: PersonalityProfile): number {
  const perfumeIntensity = perfume.sillage_rating || 3;
  
  if (perfumeIntensity >= profile.intensityRange.min && 
      perfumeIntensity <= profile.intensityRange.max) {
    return 30; // Perfect match for desired intensity
  }
  
  // Partial matches get reduced points
  const distance = Math.min(
    Math.abs(perfumeIntensity - profile.intensityRange.min),
    Math.abs(perfumeIntensity - profile.intensityRange.max)
  );
  
  return Math.max(0, 30 - (distance * 10));
}

function calculateSeasonMatch(perfume: Perfume, profile: PersonalityProfile): number {
  let score = 0;
  
  if (perfume.best_season && profile.seasonalAffinity.length > 0) {
    const matchingSeasons = perfume.best_season.filter(season =>
      profile.seasonalAffinity.some(pref => season.toLowerCase().includes(pref.toLowerCase()))
    );
    score += matchingSeasons.length * 20;
  }

  return score;
}

function getArchetypeGenderPreference(archetype: string): string | null {
  const genderMap: Record<string, string> = {
    'romantic': 'Female',
    'adventurous': 'Male',
    'classic': 'Male',
    'bohemian': 'Unisex'
  };
  
  return genderMap[archetype] || null;
}

// Enhanced preference summary with personality insights
export function getPreferenceSummary(answers: QuizAnswers): string {
  const profile = buildPersonalityProfile(answers);
  const parts: string[] = [];

  if (answers.personality) {
    const personalityOption = questions.find(q => q.id === 'personality')?.options
      .find(opt => opt.value === answers.personality);
    parts.push(personalityOption?.label.toLowerCase() || 'your essence');
  }

  if (profile.scentPreferences.length > 0) {
    parts.push(`with ${profile.scentPreferences.slice(0, 2).join(' & ')} notes`);
  }

  if (answers.energy) {
    const energyOption = questions.find(q => q.id === 'energy')?.options
      .find(opt => opt.value === answers.energy);
    parts.push(`to feel ${energyOption?.label.toLowerCase()}`);
  }

  return parts.join(' ');
}

// Helper to get questions for the summary
const questions = [
  {
    id: 'personality',
    options: [
      { value: 'romantic', label: 'The Romantic Dreamer' },
      { value: 'adventurous', label: 'The Bold Adventurer' },
      { value: 'classic', label: 'The Sophisticated Classic' },
      { value: 'bohemian', label: 'The Free Spirit' }
    ]
  },
  {
    id: 'energy',
    options: [
      { value: 'magnetic', label: 'Intrigued and Captivated' },
      { value: 'comforting', label: 'Comforted and At Ease' },
      { value: 'uplifting', label: 'Energized and Inspired' },
      { value: 'authoritative', label: 'Respected and Impressed' }
    ]
  }
];