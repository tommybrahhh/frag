'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { questions, QuizAnswers, QuizOption } from '@/lib/quiz-data';
import { getRecommendations, getPreferenceSummary, Recommendation } from '@/lib/quiz-engine';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface QuizState {
  currentStep: number;
  answers: QuizAnswers;
  isSubmitting: boolean;
  recommendations: Recommendation[];
}

// Perfume Card Component for better organization
function PerfumeCard({ recommendation, category }: { recommendation: any; category: string }) {
  const tags = Array.isArray(recommendation.perfume.vibe_tags) ? recommendation.perfume.vibe_tags : [];
  const brandName = recommendation.perfume.brand_name || "Unknown Brand";
  
  const categoryStyles = {
    top: {
      border: 'border-amber-200',
      badge: 'bg-amber-600 text-white',
      badgeText: 'Perfect Match'
    },
    switch: {
      border: 'border-blue-200',
      badge: 'bg-blue-600 text-white',
      badgeText: 'Great Alternative'
    },
    discovery: {
      border: 'border-green-200',
      badge: 'bg-green-600 text-white',
      badgeText: 'New Discovery'
    }
  };

  const style = categoryStyles[category as keyof typeof categoryStyles];

  return (
    <Link href={`/perfume/${recommendation.perfume.id}`} className={`group block bg-white rounded-2xl p-6 border-2 ${style.border} hover:shadow-xl transition duration-500`}>
      
      {/* Image Area */}
      <div className="h-48 flex items-center justify-center mb-6 p-4">
        {recommendation.perfume.image_url ? (
          <img src={recommendation.perfume.image_url} alt={recommendation.perfume.name} className="h-full object-contain group-hover:scale-110 transition duration-700" />
        ) : (
          <div className="text-stone-300 text-xs italic">No Image</div>
        )}
      </div>

      {/* Text Info */}
      <div className="text-center">
        <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">
          {brandName}
        </div>
        <h2 className="font-serif text-xl text-stone-900 mb-3 leading-tight">
          {recommendation.perfume.name}
        </h2>
        
        {/* CATEGORY BADGE */}
        <div className={`inline-block ${style.badge} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-2`}>
          {style.badgeText}
        </div>

        {/* MATCH SCORE */}
        <div className="text-sm text-green-600 font-medium mb-3">
          {Math.round(recommendation.score)}% Alignment
        </div>

        {/* MATCH REASON */}
        <div className="text-xs text-stone-600 italic mb-3">
          {recommendation.matchReason}
        </div>

        {/* VIBE TAGS */}
        <div className="flex flex-wrap justify-center gap-1 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
          {tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-[9px] border border-stone-200 px-2 py-0.5 rounded-full text-stone-500 uppercase">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);


  const [quizState, setQuizState] = useState<QuizState>({
    currentStep: 0,
    answers: {},
    isSubmitting: false,
    recommendations: []
  });

  const currentQuestion = questions[quizState.currentStep];
  const isLastQuestion = quizState.currentStep === questions.length - 1;
  const isComplete = quizState.currentStep === questions.length;

  const handleAnswer = (optionId: string) => {
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: optionId
      }
    }));
  };

  const handleNext = () => {
    console.log('Next button clicked', {
      currentStep: quizState.currentStep,
      isLastQuestion: isLastQuestion,
      hasAnswer: !!quizState.answers[currentQuestion.id]
    });
    
    if (isLastQuestion) {
      console.log('Last question - submitting quiz', {
        answers: quizState.answers
      });
      submitQuiz();
    } else {
      console.log('Moving to next question', {
        currentStep: quizState.currentStep,
        nextStep: quizState.currentStep + 1
      });
      setQuizState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    }
  };

  const handleBack = () => {
    if (quizState.currentStep > 0) {
      setQuizState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const submitQuiz = async () => {
    console.log('Starting quiz submission');
    setQuizState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      console.log('Creating Supabase client');
      const supabase = createClient();
      
      console.log('Fetching perfumes from database');
      const { data, error } = await supabase
        .from('perfumes')
        .select(`
          id, name, image_url, gender,
          vibe_tags, occasions, best_season,
          sillage_rating, price_tier,
          brand:brands!perfumes_brand_id_fkey(name)
        `);
      
      if (error) {
        console.error('Error fetching perfumes:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        return;
      }
      
      console.log('Successfully fetched perfumes:', data?.length);
      
      console.log('Flattening perfume data');
      const flatData = data?.map((p: any) => ({
        ...p,
        brand_name: p.brand?.name // Flatten it so the engine can use it easily
      })) || [];
      
      console.log('Generating recommendations');
      const { topMatches, possibleSwitches, newDiscoveries } = getRecommendations(quizState.answers, flatData);
      
      console.log('Recommendations generated:', {
        topMatches: topMatches.length,
        possibleSwitches: possibleSwitches.length,
        newDiscoveries: newDiscoveries.length
      });
      
      setQuizState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        recommendations: [...topMatches, ...possibleSwitches, ...newDiscoveries],
        isSubmitting: false
      }));
      
    } catch (error) {
      console.error('Error submitting quiz:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      setQuizState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const restartQuiz = () => {
    setQuizState({
      currentStep: 0,
      answers: {},
      isSubmitting: false,
      recommendations: []
    });
  };

  const exitQuiz = () => {
    router.push('/');
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full">
          {quizState.isSubmitting ? (
            <div className="text-center">
              <div className="animate-pulse mb-8">
                <div className="w-16 h-16 bg-stone-200 rounded-full mx-auto mb-4"></div>
              </div>
              <h2 className="font-serif text-3xl text-stone-900 mb-4">Finding your signature scent...</h2>
              <p className="text-stone-600">Analyzing your preferences to find the perfect match</p>
            </div>
          ) : (
            <div>
              <div className="text-center mb-12">
                <h1 className="font-serif text-4xl text-stone-900 mb-4">Soul Scents Found</h1>
                <p className="text-stone-600 text-lg mb-6">
                  Fragrances that resonate with your essence: {getPreferenceSummary(quizState.answers)}
                </p>
                
                {/* PERSONALITY INSIGHTS */}
                <div className="max-w-2xl mx-auto bg-stone-50 rounded-xl p-6 border border-stone-200">
                  <h3 className="font-serif text-lg text-stone-900 mb-3">Your Scent Personality</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Based on your choices, you're drawn to scents that tell a story - ones that capture
                    depth, emotion, and authenticity. Your perfect fragrance should feel like an extension
                    of your spirit, not just a pleasant aroma.
                  </p>
                </div>
              </div>
              
              {/* TOP MATCHES SECTION */}
              <div className="mb-12">
                <h2 className="font-serif text-2xl text-stone-900 mb-6 text-center">Your Perfect Matches</h2>
                <p className="text-stone-600 text-center mb-8">These fragrances align perfectly with your personality and preferences</p>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {quizState.recommendations.slice(0, 3).map((rec) => (
                    <PerfumeCard key={rec.perfume.id} recommendation={rec} category="top" />
                  ))}
                </div>
              </div>

              {/* POSSIBLE SWITCHES SECTION */}
              <div className="mb-12">
                <h2 className="font-serif text-2xl text-stone-900 mb-6 text-center">Possible Switches</h2>
                <p className="text-stone-600 text-center mb-8">Consider these alternatives that complement your current style</p>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {quizState.recommendations.slice(3, 6).map((rec) => (
                    <PerfumeCard key={rec.perfume.id} recommendation={rec} category="switch" />
                  ))}
                </div>
              </div>

              {/* NEW DISCOVERIES SECTION */}
              <div className="mb-12">
                <h2 className="font-serif text-2xl text-stone-900 mb-6 text-center">New Discoveries</h2>
                <p className="text-stone-600 text-center mb-8">Explore these fresh options that might surprise you</p>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {quizState.recommendations.slice(6, 9).map((rec) => (
                    <PerfumeCard key={rec.perfume.id} recommendation={rec} category="discovery" />
                  ))}
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <button
                  onClick={restartQuiz}
                  className="bg-white border border-stone-300 text-stone-700 px-8 py-3 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
                >
                  Take Quiz Again
                </button>
                <div>
                  <button
                    onClick={exitQuiz}
                    className="text-stone-400 hover:text-stone-600 text-sm px-4 py-2 transition-colors"
                  >
                    Exit Quiz
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 relative">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              Question {quizState.currentStep + 1} of {questions.length}
            </span>
            <span className="text-xs text-stone-400">
              {Math.round(((quizState.currentStep + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div
              className="bg-stone-900 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((quizState.currentStep + 1) / questions.length) * 100}%`
              }}
            ></div>
          </div>
        </div>


        {/* Question Card */}
        <div className="bg-white rounded-2xl p-8 border border-stone-100 shadow-sm">
          <h2 className="font-serif text-2xl text-stone-900 mb-8 text-center">
            {currentQuestion.question}
          </h2>
          
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option: QuizOption) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                  quizState.answers[currentQuestion.id] === option.value
                    ? 'border-stone-900 bg-stone-50 text-stone-900'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button
                onClick={exitQuiz}
                className="text-stone-400 hover:text-stone-600 text-sm px-3 py-2 transition-colors"
              >
                Exit
              </button>
              <button
                onClick={handleBack}
                disabled={quizState.currentStep === 0}
                className="px-6 py-2 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Back
              </button>
            </div>
            
            <button
              onClick={handleNext}
              disabled={!quizState.answers[currentQuestion.id]}
              className="bg-stone-900 text-white px-8 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
            >
              {isLastQuestion ? 'Find My Scent' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}