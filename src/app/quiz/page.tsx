'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { questions, QuizAnswers, QuizOption } from '@/lib/quiz-data';
import { getRecommendations, getPreferenceSummary } from '@/lib/quiz-engine';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface QuizState {
  currentStep: number;
  answers: QuizAnswers;
  isSubmitting: boolean;
  recommendations: any[];
}

export default function QuizPage() {
  const router = useRouter();
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
    if (isLastQuestion) {
      submitQuiz();
    } else {
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
    setQuizState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Fetch all perfumes from the database with correct join syntax
      const supabase = createClient();
      const { data, error } = await supabase
        .from('perfumes')
        .select(`
          id, name, image_url, gender,
          vibe_tags, occasions, best_season,
          sillage_rating, price_tier,
          brand:brands!perfumes_brand_id_fkey(name)
        `);
      
      if (error) {
        console.error('Error fetching perfumes:', error);
        return;
      }
      
      // Flatten the data structure for the recommendation engine
      const flatData = data?.map((p: any) => ({
        ...p,
        brand_name: p.brand?.name // Flatten it so the engine can use it easily
      })) || [];
      
      // Get recommendations
      const recommendations = getRecommendations(quizState.answers, flatData);
      
      setQuizState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        recommendations,
        isSubmitting: false
      }));
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
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

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6 py-12">
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
              
              <div className="grid md:grid-cols-3 gap-8">
                {quizState.recommendations.map((rec) => {
                  // SAFE ACCESS: Ensure arrays exist before using them
                  const tags = Array.isArray(rec.perfume.vibe_tags) ? rec.perfume.vibe_tags : [];
                  const brandName = rec.perfume.brand_name || "Unknown Brand";

                  return (
                    <Link key={rec.perfume.id} href={`/perfume/${rec.perfume.id}`} className="group block bg-white rounded-2xl p-6 border border-stone-100 hover:shadow-xl transition duration-500">
                       
                       {/* Image Area */}
                       <div className="h-48 flex items-center justify-center mb-6 p-4">
                         {rec.perfume.image_url ? (
                           <img src={rec.perfume.image_url} alt={rec.perfume.name} className="h-full object-contain group-hover:scale-110 transition duration-700" />
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
                           {rec.perfume.name}
                         </h2>
                         
                         {/* PERSONALITY MATCH BADGE */}
                         <div className="inline-block bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-2">
                           {rec.personalityMatch[0] || "Soul Match"}
                         </div>
     
                         {/* MATCH SCORE */}
                         <div className="text-sm text-green-600 font-medium mb-3">
                           {Math.round(rec.score)}% Alignment
                         </div>
     
                         {/* MATCH REASON */}
                         <div className="text-xs text-stone-600 italic mb-3">
                           {rec.matchReason}
                         </div>
     
                         {/* VIBE TAGS (The Safe Fix) */}
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
                })}
              </div>
              
              <div className="text-center">
                <button
                  onClick={restartQuiz}
                  className="bg-white border border-stone-300 text-stone-700 px-8 py-3 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
                >
                  Take Quiz Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6 py-12">
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
          
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={quizState.currentStep === 0}
              className="px-6 py-2 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>
            
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