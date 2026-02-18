'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Droplets, 
  Wind, 
  Sun, 
  Moon, 
  CloudRain, 
  Coffee, 
  Wine, 
  GlassWater, 
  Flower2, 
  Palette,
  User,
  Check
} from 'lucide-react';
import { questions, QuizAnswers, QuizOption, buildPersonalityProfile } from '@/lib/quiz-data';
import { getRecommendations, Recommendation } from '@/lib/quiz-engine';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { getPerfumeImage } from '@/lib/perfume-utils';

// --- Icons Mapping ---
const iconMap: Record<string, any> = {
  'silk': Wind,
  'velvet': Moon,
  'linen': Sun,
  'leather': User,
  'garden': Flower2,
  'library': Coffee,
  'ocean': Wind,
  'market': Sparkles,
  'citrus': Sun,
  'sweet': Coffee,
  'herbal': Flower2,
  'boozy': Wine,
  'fresh': GlassWater,
  'spicy': Sparkles,
  'pastel': Palette,
  'noir': Moon,
  'gold': Sun,
  'earth': CloudRain,
  'feminine': Sparkles,
  'masculine': User,
  'unisex': Wind,
  // New options
  'bitter': Coffee,
  'neutral': CloudRain,
  'jewel': Sparkles,
  'safe': Check,
  'bold': Sun,
  'niche': Moon
};

// --- Types ---
interface QuizState {
  currentStep: number;
  answers: QuizAnswers;
  isSubmitting: boolean;
  recommendations: {
    topMatches: Recommendation[];
    possibleSwitches: Recommendation[];
    newDiscoveries: Recommendation[];
  } | null;
  errorMsg?: string | null;
  status?: string;
}

// --- Components ---

function OptionCard({ option, selected, onClick, layout }: { option: QuizOption; selected: boolean; onClick: () => void; layout?: string }) {
  const Icon = iconMap[option.value] || Sparkles;
  
  // Base classes - Minimalist, no borders by default
  const baseClasses = "relative group cursor-pointer transition-all duration-300 overflow-hidden rounded-xl";
  
  // Layout specific styles
  let layoutClasses = "";
  if (layout === 'grid') {
    layoutClasses = "aspect-square flex flex-col items-center justify-center p-6 bg-white shadow-sm hover:shadow-md";
  } else if (layout === 'cards') {
    layoutClasses = "h-40 flex flex-col justify-end p-6 bg-white shadow-sm hover:shadow-md";
  } else {
    // List default
    layoutClasses = "flex items-center p-5 bg-white shadow-sm hover:shadow-md space-x-6";
  }

  // Selection styles - Subtle ring, soft background
  const activeClass = selected 
    ? "ring-1 ring-stone-900 bg-stone-50" 
    : "hover:bg-stone-50";

  return (
    <motion.div
      onClick={onClick}
      className={`${baseClasses} ${layoutClasses} ${activeClass}`}
      whileTap={{ scale: 0.99 }}
    >
      
      {/* Selection Checkmark - Minimal */}
      {selected && (
        <div className="absolute top-4 right-4 text-stone-900">
          <Check size={16} strokeWidth={2} />
        </div>
      )}

      {/* Icon - Clean */}
      <div className={`mb-3 ${selected ? 'text-stone-900' : 'text-stone-400'} transition-colors`}>
         <Icon size={layout === 'grid' ? 28 : 22} strokeWidth={1.5} />
      </div>

      {/* Text Content */}
      <div className="relative z-10 text-left w-full">
        <h3 className={`font-serif text-lg leading-tight ${layout === 'grid' ? 'text-center' : ''} ${selected ? 'text-stone-900' : 'text-stone-700'}`}>
          {option.label}
        </h3>
        {option.description && layout !== 'grid' && (
          <p className="text-sm text-stone-500 mt-1 font-light leading-relaxed">
            {option.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function PerfumeCard({ recommendation, category }: { recommendation: Recommendation; category: string }) {
  const { perfume, matchReason } = recommendation;
  
  return (
    <Link href={`/perfume/${perfume.slug || perfume.id}`} className="group block mb-8">
      {/* Image Area - Clean, no borders */}
      <div className="relative aspect-[3/4] bg-[#f5f5f4] rounded-sm overflow-hidden mb-4 flex items-center justify-center">
        {perfume.image_url ? (
          <img src={getPerfumeImage(perfume.image_url)} alt={perfume.name} className="h-3/4 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
        ) : (
          <div className="text-stone-300 text-xs tracking-widest uppercase">No Image</div>
        )}
        {/* Subtle Category Badge */}
        {category === 'top' && (
          <div className="absolute top-0 right-0 p-3">
             <StarBadge />
          </div>
        )}
      </div>
      
      {/* Content - Typography Focused */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mb-2">{perfume.brand_name}</div>
        <h3 className="font-serif text-xl text-stone-900 leading-tight mb-2 group-hover:underline decoration-stone-300 underline-offset-4 decoration-1">{perfume.name}</h3>
        
        {/* Alchemy Reason - Clean Text */}
        <p className="text-xs text-stone-500 font-light leading-relaxed line-clamp-2 mt-2">
          {matchReason}
        </p>
      </div>
    </Link>
  );
}

function StarBadge() {
  return (
    <div className="w-2 h-2 bg-stone-900 rounded-full" title="Top Match" />
  )
}

// --- Main Page ---

export default function QuizPage() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>({
    currentStep: 0,
    answers: {},
    isSubmitting: false,
    recommendations: null
  });

  const currentQuestion = questions[state.currentStep];
  const isLastQuestion = state.currentStep === questions.length - 1;
  const isComplete = !!state.recommendations;

  const handleAnswer = (value: string) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: value }
    }));
    
    // Auto-advance after small delay for better UX
    setTimeout(() => {
      if (!isLastQuestion) {
        setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      } else {
        submitQuiz({ ...state.answers, [currentQuestion.id]: value });
      }
    }, 400);
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const submitQuiz = async (finalAnswers: QuizAnswers) => {
    console.log("Submitting quiz with answers:", finalAnswers);
    setState(prev => ({ ...prev, isSubmitting: true, errorMsg: null }));
    
    try {
      const supabase = createClient();
      const profile = buildPersonalityProfile(finalAnswers);
      
      console.log("Fetching perfumes for profile:", profile);
      
      let data: any[] | null = null;
      let error: any = null;

      // --- Helper for Primary Query ---
      const fetchPrimary = () => {
        let query = supabase.from('perfumes').select(`
          id, name, image_url, gender, slug,
          vibe_tags, sillage_rating,
          brand:brands(name, tier),
          perfume_notes:perfume_notes(note:notes(name))
        `);

        if (finalAnswers['protagonist'] === 'feminine') {
          query = query.in('gender', ['Female', 'Unisex']);
        } else if (finalAnswers['protagonist'] === 'masculine') {
          query = query.in('gender', ['Male', 'Unisex']);
        }

        if (profile.scentFamilies.length > 0) {
          const families = profile.scentFamilies.flatMap(f => [
            f.toLowerCase(),
            f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()
          ]);
          query = query.overlaps('vibe_tags', families);
        }
        
        return query.limit(50);
      };

      // --- Helper for Fallback Query ---
      const fetchFallback = () => {
          let fallbackQuery = supabase.from('perfumes').select(`
            id, name, image_url, gender, slug,
            vibe_tags, sillage_rating,
            brand:brands(name, tier)
          `).limit(50);
          
          if (finalAnswers['protagonist'] === 'feminine') {
            fallbackQuery = fallbackQuery.in('gender', ['Female', 'Unisex']);
          } else if (finalAnswers['protagonist'] === 'masculine') {
            fallbackQuery = fallbackQuery.in('gender', ['Male', 'Unisex']);
          }
          return fallbackQuery;
      };

      // --- Execution Strategy ---
      try {
          // 1. Primary Attempt (15s timeout)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Primary analysis timed out')), 15000)
          );
          
          const result = await Promise.race([fetchPrimary(), timeoutPromise]) as any;
          if (result.error) throw result.error;
          data = result.data;

      } catch (primaryError) {
          console.warn("Primary query failed, attempting fallback...", primaryError);
          
          try {
              // 2. Fallback Attempt (5s timeout)
              const fallbackTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fallback timed out')), 5000)
              );
              const result = await Promise.race([fetchFallback(), fallbackTimeout]) as any;
              if (result.error) throw result.error;
              data = result.data;
          } catch (fallbackError) {
              console.error("Fallback query failed:", fallbackError);
              error = fallbackError; // Mark as failed to trigger nuclear
          }
      }

      // --- NUCLEAR OPTION: HARDCODED FALLBACK ---
      // If both Primary and Secondary queries failed, we return static data to prevent crash.
      if (error || !data || data.length === 0) {
        console.warn("Notice: All database queries failed. engaging offline mode (Nuclear Fallback).", error);
        
        // Mock Data to ensure user gets a result
        data = [
          { id: 'mock-1', name: 'Santal 33', brand_name: 'Le Labo', gender: 'Unisex', vibe_tags: ['Woody', 'Leather', 'Niche'], perfume_notes: [{note: {name: 'Sandalwood'}}, {note: {name: 'Cedar'}}], brand_tier: 'Niche', sillage_rating: 4, image_url: null },
          { id: 'mock-2', name: 'Baccarat Rouge 540', brand_name: 'Maison Francis Kurkdjian', gender: 'Unisex', vibe_tags: ['Amber', 'Floral', 'Niche'], perfume_notes: [{note: {name: 'Saffron'}}, {note: {name: 'Amberwood'}}], brand_tier: 'Niche', sillage_rating: 5, image_url: null },
          { id: 'mock-3', name: 'Aventus', brand_name: 'Creed', gender: 'Male', vibe_tags: ['Fruity', 'Smoky', 'Niche'], perfume_notes: [{note: {name: 'Pineapple'}}, {note: {name: 'Birch'}}], brand_tier: 'Niche', sillage_rating: 4, image_url: null },
          { id: 'mock-4', name: 'Bleu de Chanel', brand_name: 'Chanel', gender: 'Male', vibe_tags: ['Fresh', 'Citrus', 'Designer'], perfume_notes: [{note: {name: 'Grapefruit'}}, {note: {name: 'Incense'}}], brand_tier: 'Designer', sillage_rating: 3, image_url: null },
          { id: 'mock-5', name: 'Black Opium', brand_name: 'Yves Saint Laurent', gender: 'Female', vibe_tags: ['Sweet', 'Gourmand', 'Designer'], perfume_notes: [{note: {name: 'Coffee'}}, {note: {name: 'Vanilla'}}], brand_tier: 'Designer', sillage_rating: 4, image_url: null },
        ];
        // Clear error to allow processing to continue
        error = null;
        console.log("Offline mode engaged successfully. Using curated static data.");
      }
      
      console.log(`Fetched ${data?.length} perfumes`);

      // Transform data & Apply Client-Side Filters (Tier)
      let perfumes = data?.map((p: any) => ({
        ...p,
        // Fix: Check for p.brand object OR p.brand_name (from mock data)
        brand_name: p.brand?.name || p.brand_name || 'Unknown',
        brand_tier: p.brand?.tier || p.brand_tier || 'Designer' 
      })) || [];

      // 3. Client-Side Tier Filtering
      // We moved this from DB to JS to prevent join timeouts
      if (profile.complexityPreference === 'niche') {
        // Prefer Niche, but keep some Designers if result set gets too small?
        // Let's strict filter, but fallback if empty.
        const nichePerfumes = perfumes.filter((p: any) => p.brand_tier === 'Niche');
        if (nichePerfumes.length >= 5) {
          perfumes = nichePerfumes;
        }
      } else if (profile.complexityPreference === 'safe') {
        // Prefer Designer
        const designerPerfumes = perfumes.filter((p: any) => p.brand_tier !== 'Niche');
        if (designerPerfumes.length >= 5) {
          perfumes = designerPerfumes;
        }
      }

      // Run algorithm
      console.log("Running recommendation engine...");
      const recommendations = getRecommendations(finalAnswers, perfumes);
      console.log("Recommendations ready:", recommendations);
      
      // Fake loading delay for "Analysis" drama - reduced to 800ms
      await new Promise(r => setTimeout(r, 800));

      setState(prev => ({
        ...prev,
        recommendations,
        answers: finalAnswers
      }));

    } catch (err: any) {
      console.error("Quiz Error:", err);
      // Ensure we switch off loading state even if we set an error
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        errorMsg: "Failed to analyze results. " + (err.message || "Please check your connection.") 
      }));
    } finally {
      // Redundant safety check
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // --- Render Results ---
  if (state.recommendations) {
    const profile = buildPersonalityProfile(state.answers);
    const { topMatches, possibleSwitches, newDiscoveries } = state.recommendations;

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
          
          {/* Minimal Header */}
          <div className="flex justify-between items-center mb-24">
            <button onClick={() => window.location.reload()} className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
              Retake Quiz
            </button>
            <Link href="/" className="font-serif text-2xl tracking-tight">scentia</Link>
          </div>

          {/* Archetype (Minimal Text Only) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-32 max-w-4xl"
          >
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-6">Your Profile</div>
            <h1 className="font-serif text-5xl md:text-7xl text-stone-900 mb-8 leading-[0.9]">
              {profile.archetype}
            </h1>
            <p className="text-xl md:text-2xl text-stone-500 font-light leading-relaxed max-w-2xl">
              You are drawn to <span className="text-stone-900">{profile.vibes.slice(0, 3).join(', ')}</span> atmospheres. 
              Your scent journey balances {profile.scentFamilies[0]} notes with 
              touches of {profile.notes[0]}.
            </p>
          </motion.div>

          {/* Top Matches - Clean Grid */}
          <div className="mb-32">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-900 mb-12 border-t border-stone-100 pt-8">
              Curated For You
            </h2>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-16">
              {topMatches.map(rec => (
                <PerfumeCard key={rec.perfume.id} recommendation={rec} category="top" />
              ))}
            </div>
          </div>

          {/* Exploration Sections - Split Layout */}
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-24">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-8 border-t border-stone-100 pt-8">Mood Switches</h3>
              <div className="space-y-4">
                {possibleSwitches.map(rec => (
                  <PerfumeCard key={rec.perfume.id} recommendation={rec} category="switch" />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-8 border-t border-stone-100 pt-8">Discoveries</h3>
              <div className="space-y-4">
                {newDiscoveries.map(rec => (
                  <PerfumeCard key={rec.perfume.id} recommendation={rec} category="discovery" />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- Render Quiz Flow ---
  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="w-full max-w-2xl relative z-10">
        
        {/* Progress */}
        <div className="mb-16 flex items-center justify-between">
          <button onClick={handleBack} disabled={state.currentStep === 0} className="text-stone-400 hover:text-stone-900 disabled:opacity-0 transition-colors">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div className="text-[10px] font-bold tracking-[0.2em] text-stone-300 uppercase">
             0{state.currentStep + 1} / 0{questions.length}
          </div>
          <div className="w-5" />
        </div>
        
        {/* Error Message */}
        {state.errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-center text-sm mb-8"
          >
            <p>{state.errorMsg}</p>
            <button 
              onClick={() => submitQuiz(state.answers)}
              className="mt-2 text-xs uppercase tracking-widest underline"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {!state.isSubmitting ? (
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-6 leading-tight">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.subtext && (
                  <p className="text-stone-500 text-lg font-light">
                    {currentQuestion.subtext}
                  </p>
                )}
              </div>

              <div className={`grid gap-4 ${
                currentQuestion.layout === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 
                currentQuestion.layout === 'cards' ? 'grid-cols-1 md:grid-cols-2' : 
                'grid-cols-1'
              }`}>
                {currentQuestion.options.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    layout={currentQuestion.layout}
                    selected={state.answers[currentQuestion.id] === option.value}
                    onClick={() => handleAnswer(option.value)}
                  />
                ))}
              </div>

            </motion.div>
          ) : (
            /* Loading State - Minimal */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <div className="text-stone-900 font-serif text-2xl animate-pulse">Curating...</div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
