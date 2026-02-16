'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Database } from '@/types/database';
import { createClient } from '@/utils/supabase/client';
import { formatRelativeTime } from '@/utils/timeUtils';

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------

type EnrichedComment = {
  id: string;
  user_id: string;
  perfume_id: string;
  content: string;
  user_name: string;
  created_at: string;
  avatar_url: string | null;
  is_verified: boolean | null;
  is_owner: boolean;
};

// Global cache to keep comments instant when navigating back/forth
const commentsCache: Record<string, { data: EnrichedComment[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// ------------------------------------------------------------------
// HELPER: TEXT FORMATTER
// ------------------------------------------------------------------
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.trim().startsWith('>')) {
          return (
            <blockquote key={i} className="border-l-2 border-stone-300 pl-4 italic text-stone-600 my-2">
              {line.replace(/^>\s?/, '')}
            </blockquote>
          );
        }
        // Simple parser for **Bold** and *Italic*
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <p key={i} className="min-h-[1.5em]">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={j} className="italic">{part.slice(1, -1)}</em>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------
// HELPER: SMART TAGS (Auto-detected from text)
// ------------------------------------------------------------------
const extractContext = (content: string) => {
  const text = content.toLowerCase();
  const badges = [];

  if (text.includes('beast mode') || text.includes('eternal') || text.includes('strong')) badges.push({ label: 'Strong Performance', color: 'purple' });
  if (text.includes('weak') || text.includes('skin scent') || text.includes('gone in')) badges.push({ label: 'Intimate Sillage', color: 'stone' });
  if (text.includes('office') || text.includes('work') || text.includes('daily')) badges.push({ label: 'Office Safe', color: 'blue' });
  if (text.includes('date') || text.includes('night') || text.includes('sexy')) badges.push({ label: 'Date Night', color: 'rose' });
  if (text.includes('summer') || text.includes('heat') || text.includes('fresh')) badges.push({ label: 'Summer', color: 'amber' });
  if (text.includes('winter') || text.includes('cold') || text.includes('cozy')) badges.push({ label: 'Winter', color: 'indigo' });
  if (text.includes('blind buy') || text.includes('safe buy')) badges.push({ label: 'Safe Blind Buy', color: 'emerald' });
  
  return badges.slice(0, 3);
};

export default function CommentsSection({ perfumeId }: { perfumeId: string }) {
  const { user } = useAuth();
  const supabase = createClient();
  
  // Initialize from cache if available for instant load
  const [comments, setComments] = useState<EnrichedComment[]>(() => {
    if (typeof window !== 'undefined' && commentsCache[perfumeId]) {
      const cached = commentsCache[perfumeId];
      if (Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
    }
    return [];
  });
  
  const [newComment, setNewComment] = useState('');
  const [isFeedLoading, setIsFeedLoading] = useState(!comments.length);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchComments = useCallback(async (showLoading = true) => {
    if (showLoading) setIsFeedLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('get_perfume_comments' as any, { 
        p_perfume_id: perfumeId 
      } as any);

      if (error) throw error;
      
      const enriched = data || [];
      setComments(enriched);
      
      commentsCache[perfumeId] = {
        data: enriched,
        timestamp: Date.now()
      };
    } catch (err: any) {
      console.error('Error fetching comments:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
    } finally {
      setIsFeedLoading(false);
    }
  }, [perfumeId, supabase]);

  useEffect(() => { 
    fetchComments(!comments.length); 
  }, [fetchComments]);

  const insertFormat = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    setNewComment(before + prefix + selection + suffix + after);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    
    const contentToPost = newComment;
    setNewComment('');
    setIsSubmitting(true);

    const tempId = crypto.randomUUID();
    const optimisticComment: EnrichedComment = {
      id: tempId,
      user_id: user.id,
      perfume_id: perfumeId,
      content: contentToPost,
      user_name: user.display_name || 'Member',
      created_at: new Date().toISOString(),
      avatar_url: user.user_metadata?.avatar_url || null,
      is_verified: false,
      is_owner: false,
    };

    setComments(prev => [optimisticComment, ...prev]);
    
    const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        perfume_id: perfumeId,
        content: contentToPost,
        user_name: user.display_name || 'Member', 
    } as any);

    if (error) {
        setComments(prev => prev.filter(c => c.id !== tempId));
        setNewComment(contentToPost);
    } else {
        fetchComments(false);
    }
    setIsSubmitting(false);
  };

  return (
    <section className="max-w-4xl mx-auto px-6 mt-24 mb-32">
      {/* HEADER */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-8 h-px bg-stone-200" />
           <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">
             The Common Room
           </span>
           <div className="w-8 h-px bg-stone-200" />
        </div>
        <h3 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4">
          Community <span className="italic text-stone-400">Notes</span>
        </h3>
        <p className="text-stone-500 text-sm md:text-base max-w-md font-light">
          Real stories and honest impressions from people who have worn this scent.
        </p>
      </div>

      {/* INPUT AREA */}
      <div className="mb-20">
        {user ? (
          <div className={`bg-white rounded-[2rem] border transition-all duration-500 ${isFocused ? 'border-stone-300 shadow-xl' : 'border-stone-100 shadow-sm'}`}>
            <form onSubmit={handleSubmit} className="p-2">
              <div className="relative">
                <textarea 
                  ref={textareaRef}
                  value={newComment}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What's your story with this scent?"
                  className="w-full p-6 md:p-8 bg-transparent text-stone-800 text-base md:text-lg min-h-[140px] outline-none resize-none placeholder:text-stone-300 font-serif leading-relaxed"
                />
                
                {/* Formatting Tools - Only visible on focus or when text exists */}
                <div className={`flex items-center justify-between px-4 pb-4 transition-all duration-300 ${isFocused || newComment ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => insertFormat('**', '**')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors text-xs font-bold">B</button>
                    <button type="button" onClick={() => insertFormat('*', '*')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors text-xs italic font-serif">I</button>
                    <button type="button" onClick={() => insertFormat('> ', '')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors text-xs">❝</button>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-8 py-3 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-all disabled:opacity-30 shadow-lg active:scale-95"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Note'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-stone-50/50 border border-dashed border-stone-200 rounded-[2rem] p-12 text-center">
            <p className="text-stone-400 text-sm mb-6 font-light italic">Join the conversation to share your experience.</p>
            <Link href="/login" className="inline-flex px-10 py-4 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-all shadow-md">
              Log In to Scentia
            </Link>
          </div>
        )}
      </div>

      {/* FEED */}
      <div className="space-y-12">
        {isFeedLoading && !comments.length ? (
          <div className="space-y-8">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-6 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-4 pt-2">
                  <div className="h-4 bg-stone-100 rounded w-1/4" />
                  <div className="h-20 bg-stone-50 rounded-2xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✍️</span>
            </div>
            <h3 className="font-serif text-xl text-stone-400 mb-2 italic">Be the first to speak</h3>
            <p className="text-stone-300 text-sm uppercase tracking-widest font-bold">No notes yet</p>
          </div>
        ) : (
          comments.map((comment) => {
            const detectedBadges = extractContext(comment.content);

            return (
              <div key={comment.id} className="group flex gap-4 md:gap-8 items-start">
                {/* User Column */}
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white overflow-hidden border border-stone-100 shadow-sm relative group-hover:shadow-md transition-shadow">
                    {comment.avatar_url ? (
                      <img src={comment.avatar_url} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300 font-serif text-xl">
                        {comment.user_name?.[0]}
                      </div>
                    )}
                  </div>
                  {comment.is_owner && (
                    <div className="bg-amber-400 w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white -mt-7 z-10" title="Verified Owner">
                      <svg className="w-2.5 h-2.5 text-stone-900 fill-current" viewBox="0 0 20 20">
                         <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" fillRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Content Column */}
                <div className="flex-1 pt-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                    <span className="font-serif text-lg text-stone-900">{comment.user_name}</span>
                    {comment.is_verified && (
                      <span title="Verified Collector" className="text-blue-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                           <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" fillRule="evenodd"/>
                        </svg>
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest pt-0.5">
                      {mounted ? formatRelativeTime(comment.created_at) : ''}
                    </span>
                  </div>

                  <div className="prose prose-stone max-w-none font-serif text-stone-700 leading-relaxed text-base md:text-lg mb-6">
                    <FormattedText text={comment.content} />
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {detectedBadges.map((badge, i) => (
                        <span key={i} className="text-[8px] md:text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full bg-stone-50 text-stone-400 border border-stone-100">
                          {badge.label}
                        </span>
                      ))}
                    </div>

                    {user?.id === comment.user_id && (
                       <button className="text-[9px] font-bold uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-colors">
                         Edit Note
                       </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}