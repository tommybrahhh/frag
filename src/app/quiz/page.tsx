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
  
  // Base classes
  const baseClasses = "relative group cursor-pointer transition-all duration-300 overflow-hidden";
  
  // Layout specific styles
  let layoutClasses = "";
  if (layout === 'grid') {
    layoutClasses = "aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border-2";
  } else if (layout === 'cards') {
    layoutClasses = "h-48 flex flex-col justify-end p-6 rounded-3xl border-2";
  } else {
    // List default
    layoutClasses = "flex items-center p-4 rounded-xl border-2 space-x-4";
  }

  // Selection styles
  const activeClass = selected 
    ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900 shadow-md transform scale-[1.02]" 
    : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-stone-200 hover:-translate-y-1";

  // Gradient Background (if available)
  const bgStyle = option.color && layout !== 'list' ? option.color : '';

  return (
    <motion.div
      onClick={onClick}
      className={`${baseClasses} ${layoutClasses} ${activeClass}`}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Gradient/Color */}
      {bgStyle && (
        <div className={`absolute inset-0 opacity-10 ${bgStyle} transition-opacity duration-300 group-hover:opacity-20`} />
      )}
      
      {/* Selection Checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 text-stone-900 bg-white rounded-full p-1 shadow-sm">
          <Check size={14} strokeWidth={3} />
        </div>
      )}

      {/* Icon */}
      <div className={`mb-3 ${selected ? 'text-stone-900' : 'text-stone-400'} transition-colors`}>
         <Icon size={layout === 'grid' ? 32 : 24} />
      </div>

      {/* Text Content */}
      <div className="relative z-10 text-left w-full">
        <h3 className={`font-serif font-medium leading-tight ${layout === 'grid' ? 'text-center' : ''} ${selected ? 'text-stone-900' : 'text-stone-700'}`}>
          {option.label}
        </h3>
        {option.description && layout !== 'grid' && (
          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
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
    <Link href={`/perfume/${perfume.slug || perfume.id}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100">
      <div className="relative h-48 bg-stone-50 p-6 flex items-center justify-center">
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={perfume.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="text-stone-300 text-xs italic">No Image</div>
        )}
        {category === 'top' && (
          <div className="absolute top-3 right-3 bg-stone-900 text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold">
            Best Match
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">{perfume.brand_name}</div>
        <h3 className="font-serif text-lg text-stone-900 leading-tight mb-2 group-hover:text-amber-700 transition-colors">{perfume.name}</h3>
        
        <div className="flex items-center space-x-2 text-xs text-amber-600 font-medium">
          <Sparkles size={12} />
          <span>{matchReason}</span>
        </div>
      </div>
    </Link>
  );
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
      
      console.log("Fetching perfumes...");
      
      // Optimize: Select only necessary fields and filter by gender
      let query = supabase.from('perfumes').select(`
        id, name, image_url, gender, slug,
        vibe_tags, sillage_rating,
        brand:brands(name),
        perfume_notes:perfume_notes(note:notes(name))
      `);

      // Apply Gender Filter
      const userGender = finalAnswers['protagonist'];
      if (userGender === 'feminine') {
        query = query.in('gender', ['Female', 'Unisex']);
      } else if (userGender === 'masculine') {
        query = query.in('gender', ['Male', 'Unisex']);
      }
      // If 'unisex', we fetch all (Male, Female, Unisex) as they might be open to anything
      
      query = query.limit(250); // Keep limit but applying filter makes it more relevant

      // Add a timeout to prevent hanging indefinitely
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timed out. Please try again.')), 30000)
      );

      const { data, error } = await Promise.race([
        query,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length} perfumes`);

      // Transform data for engine
      const perfumes = data?.map((p: any) => ({
        ...p,
        brand_name: p.brand?.name || 'Unknown'
      })) || [];

      // Run algorithm
      console.log("Running recommendation engine...");
      const recommendations = getRecommendations(finalAnswers, perfumes);
      console.log("Recommendations ready:", recommendations);
      
      // Fake loading delay for "Analysis" drama
      await new Promise(r => setTimeout(r, 1500));

      setState(prev => ({
        ...prev,
        recommendations,
        answers: finalAnswers
      }));

    } catch (err: any) {
      console.error("Quiz Error:", err);
      setState(prev => ({ ...prev, errorMsg: "Failed to analyze results. " + (err.message || "Please check your connection.") }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // --- Render Results ---
  if (state.recommendations) {
    const profile = buildPersonalityProfile(state.answers);
    const { topMatches, possibleSwitches, newDiscoveries } = state.recommendations;

    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <button onClick={() => window.location.reload()} className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-2">
              <ArrowLeft size={16} /> Retake Quiz
            </button>
            <Link href="/" className="font-serif text-xl tracking-tighter">scent.ai</Link>
          </div>

          {/* Archetype Card (Hero) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stone-900 text-stone-50 rounded-3xl p-8 md:p-12 mb-16 relative overflow-hidden"
          >
            {/* Abstract Background Art */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-purple-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
            
            <div className="relative z-10 max-w-2xl">
              <div className="uppercase tracking-widest text-xs font-bold text-amber-500 mb-4">Your Olfactory Persona</div>
              <h1 className="font-serif text-4xl md:text-6xl mb-6 leading-tight">
                {profile.archetype}
              </h1>
              <p className="text-stone-300 text-lg md:text-xl leading-relaxed mb-8">
                You are drawn to {profile.vibes.slice(0, 3).join(', ')} atmospheres. 
                Your scent journey balances {profile.scentFamilies[0] || 'unique'} notes with 
                touches of {profile.notes[0] || 'mystery'}.
              </p>
              
              <div className="flex flex-wrap gap-3">
                {profile.vibes.slice(0, 4).map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full border border-stone-700 text-xs uppercase tracking-wide text-stone-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top Matches */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl mb-8 flex items-center gap-3">
              <Sparkles className="text-amber-600" size={24} />
              Signature Matches
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {topMatches.map(rec => (
                <PerfumeCard key={rec.perfume.id} recommendation={rec} category="top" />
              ))}
            </div>
          </div>

          {/* Exploration Sections */}
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-serif text-2xl mb-6 text-stone-600">Alternative Moods</h3>
              <div className="space-y-4">
                {possibleSwitches.map(rec => (
                  <PerfumeCard key={rec.perfume.id} recommendation={rec} category="switch" />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-serif text-2xl mb-6 text-stone-600">Wildcard Discoveries</h3>
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
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,240,230,0.8),transparent_70%)]" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Progress */}
        <div className="mb-12 flex items-center justify-between text-xs font-bold tracking-widest text-stone-400 uppercase">
          <button onClick={handleBack} disabled={state.currentStep === 0} className="hover:text-stone-900 disabled:opacity-0 transition-colors">
            Back
          </button>
          <span>Step {state.currentStep + 1} / {questions.length}</span>
          <span>{/* Spacer */}</span>
        </div>
        
        {/* Error Message */}
        {state.errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 text-center text-sm border border-red-100 shadow-sm"
          >
            <p className="font-medium">{state.errorMsg}</p>
            <button 
              onClick={() => submitQuiz(state.answers)}
              className="mt-2 text-xs uppercase tracking-wide font-bold underline hover:text-red-800"
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
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-10">
                <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.subtext && (
                  <p className="text-stone-500 text-lg">
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
            /* Loading State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto mb-8" />
              <h3 className="font-serif text-2xl text-stone-900 mb-2">Analyzing your essence...</h3>
              <p className="text-stone-500">Curating your personal fragrance gallery.</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
