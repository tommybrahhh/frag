'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  MessageSquare, 
  Send, 
  Bold, 
  Italic, 
  Quote, 
  User, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  Flag,
  Edit2,
  Trash2,
  Sparkles,
  Zap,
  Coffee,
  Sun,
  Snowflake,
  ShieldCheck
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/timeUtils';
import { getContributorLevel } from '@/utils/communityUtils';

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
  total_activity?: number;
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
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        
        if (line.trim().startsWith('>')) {
          return (
            <blockquote key={i} className="border-l-2 border-stone-200 pl-4 italic text-stone-500 my-4 py-1">
              {line.replace(/^>\s?/, '')}
            </blockquote>
          );
        }
        // Simple parser for **Bold** and *Italic*
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={j} className="italic text-stone-800">{part.slice(1, -1)}</em>;
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

  if (text.includes('beast mode') || text.includes('eternal') || text.includes('strong')) 
    badges.push({ label: 'Performance', icon: <Zap size={10} />, color: 'bg-amber-50 text-amber-600 border-amber-100' });
  
  if (text.includes('office') || text.includes('work') || text.includes('daily')) 
    badges.push({ label: 'Office Safe', icon: <Briefcase size={10} />, color: 'bg-blue-50 text-blue-600 border-blue-100' });
  
  if (text.includes('date') || text.includes('night') || text.includes('sexy')) 
    badges.push({ label: 'Date Night', icon: <Sparkles size={10} />, color: 'bg-rose-50 text-rose-600 border-rose-100' });
  
  if (text.includes('summer') || text.includes('heat') || text.includes('fresh')) 
    badges.push({ label: 'Summer', icon: <Sun size={10} />, color: 'bg-orange-50 text-orange-600 border-orange-100' });
  
  if (text.includes('winter') || text.includes('cold') || text.includes('cozy')) 
    badges.push({ label: 'Winter', icon: <Snowflake size={10} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' });
  
  if (text.includes('blind buy') || text.includes('safe buy')) 
    badges.push({ label: 'Safe Buy', icon: <CheckCircle2 size={10} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' });
  
  return badges.slice(0, 3);
};

const Briefcase = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);

export default function CommentsSection({ perfumeId, initialComments }: { perfumeId: string, initialComments?: EnrichedComment[] }) {
  const { user, supabase, loading: authLoading, supabaseInitError } = useAuth();
  
  const [comments, setComments] = useState<EnrichedComment[]>(() => {
    if (initialComments && initialComments.length > 0) return initialComments;
    
    if (typeof window !== 'undefined' && commentsCache[perfumeId]) {
      const cached = commentsCache[perfumeId];
      if (Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
    }
    return [];
  });
  
  const [newComment, setNewComment] = useState('');
  const [isFeedLoading, setIsFeedLoading] = useState(initialComments === undefined && comments.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchComments = useCallback(async (showLoading = true) => {
    if (showLoading) setIsFeedLoading(true);
    setError(null);

    if (!supabase) {
      if (!authLoading) {
        setError(supabaseInitError || 'Connection lost. Please refresh.');
        setIsFeedLoading(false);
      }
      return;
    }
    
    try {
      let { data, error: rpcError } = await supabase.rpc('get_perfume_comments' as any, { 
        p_perfume_id: perfumeId 
      } as any);

      if (rpcError) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('comments')
          .select(`
            id, user_id, perfume_id, content, user_name, created_at,
            profiles:user_id (
              avatar_url,
              is_verified
            )
          `)
          .eq('perfume_id', perfumeId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: true });

        if (fallbackError) throw fallbackError;

        data = (fallbackData || []).map((c: any) => ({
          ...c,
          avatar_url: c.profiles?.avatar_url || null,
          is_verified: c.profiles?.is_verified || false,
          is_owner: false
        }));
      }
      
      const enriched = data || [];
      setComments(enriched);
      
      commentsCache[perfumeId] = {
        data: enriched,
        timestamp: Date.now()
      };
    } catch (err: any) {
      setError(err.message || 'Unable to load the conversation');
    } finally {
      setIsFeedLoading(false);
    }
  }, [perfumeId, supabase, authLoading, supabaseInitError]);

  useEffect(() => { 
    if (mounted && !authLoading && initialComments === undefined) {
      fetchComments(!comments.length);
    }
  }, [fetchComments, mounted, authLoading, initialComments]);

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
    if (!user || !newComment.trim() || !supabase) return;
    
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
      avatar_url: user.avatar_url || null,
      is_verified: user.is_verified || false,
      is_owner: false,
    };

    setComments(prev => [optimisticComment, ...prev]);
    
    const { error: insertError } = await supabase.from('comments').insert({
        user_id: user.id,
        perfume_id: perfumeId,
        content: contentToPost,
        user_name: user.display_name || 'Member', 
    } as any);

    if (insertError) {
        setComments(prev => prev.filter(c => c.id !== tempId));
        setNewComment(contentToPost);
    } else {
        fetchComments(false);
    }
    setIsSubmitting(false);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 md:px-6 mt-20 md:mt-32 mb-40">
      {/* HEADER */}
      <div className="flex flex-col items-center text-center mb-12 md:mb-20">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-stone-50 border border-stone-100 mb-4 md:mb-6">
           <MessageSquare size={12} className="text-stone-400" />
           <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">
             Community Reviews
           </span>
        </div>
        <h2 className="font-serif text-3xl md:text-6xl text-stone-900 mb-4">
          The <span className="italic text-stone-400">Discussion</span>
        </h2>
        <p className="text-stone-500 text-sm md:text-base max-w-lg font-light leading-relaxed">
          Read what other members are saying about this fragrance and share your own experience.
        </p>
      </div>

      {/* INPUT AREA */}
      <div className="mb-16 md:mb-24">
        {user ? (
          <div className={`bg-white rounded-3xl md:rounded-[2.5rem] border transition-all duration-700 ${isFocused ? 'border-stone-900 shadow-2xl shadow-stone-200' : 'border-stone-100 shadow-sm'}`}>
            <form onSubmit={handleSubmit}>
              <div className="p-3 md:p-6">
                <textarea 
                  ref={textareaRef}
                  value={newComment}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What's your take? (e.g., How does it smell on you?)"
                  className="w-full p-4 md:p-8 bg-stone-50/50 rounded-2xl text-stone-800 text-base md:text-lg min-h-[120px] md:min-h-[160px] outline-none resize-none placeholder:text-stone-300 font-serif leading-relaxed transition-colors focus:bg-white"
                />
              </div>
              
              <div className={`flex flex-col sm:flex-row items-center justify-between px-6 md:px-10 pb-6 md:pb-8 gap-4 transition-all duration-500 ${isFocused || newComment ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="flex items-center gap-2">
                  <button type="button" title="Bold" onClick={() => insertFormat('**', '**')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-all border border-transparent hover:border-stone-100"><Bold size={16} /></button>
                  <button type="button" title="Italic" onClick={() => insertFormat('*', '*')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-all border border-transparent hover:border-stone-100"><Italic size={16} /></button>
                  <button type="button" title="Quote" onClick={() => insertFormat('> ', '')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-all border border-transparent hover:border-stone-100"><Quote className="w-4 h-4" /></button>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !newComment.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-all disabled:opacity-30 shadow-xl active:scale-95"
                >
                  {isSubmitting ? (
                    'Publishing...'
                  ) : (
                    <>
                      <span>Post Review</span>
                      <Send className="w-3.5 h-3.5 opacity-50" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-[#FDFBF7] border border-stone-100 rounded-3xl md:rounded-[2.5rem] p-8 md:p-16 text-center shadow-inner">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-sm">
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-stone-300" />
            </div>
            <h3 className="font-serif text-xl md:text-2xl text-stone-900 mb-3">Join the community</h3>
            <p className="text-stone-400 text-xs md:text-sm mb-8 md:mb-10 font-light italic max-w-xs mx-auto">Create an account to share your thoughts with other enthusiasts.</p>
            <Link href="/login" className="inline-flex px-10 py-4 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-stone-800 transition-all shadow-xl">
              Log in to review
            </Link>
          </div>
        )}
      </div>

      {/* FEED */}
      <div className="space-y-10 md:space-y-16">
        {isFeedLoading && !comments.length ? (
          <div className="space-y-8 md:space-y-12">
            {[1, 2].map(i => (
              <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-8 animate-pulse">
                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-4 md:space-y-6 pt-2">
                  <div className="h-6 bg-stone-100 rounded-lg w-1/4" />
                  <div className="h-24 md:h-32 bg-stone-50 rounded-2xl md:rounded-[2rem] w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error && !comments.length ? (
          <div className="text-center py-12 md:py-20 bg-red-50/30 rounded-3xl md:rounded-[2.5rem] border border-red-100/50">
            <Flag size={32} className="text-red-200 mx-auto mb-6" />
            <h3 className="font-serif text-xl text-stone-900 mb-2">{error}</h3>
            <button 
              onClick={() => fetchComments(true)}
              className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20 md:py-32 border-2 border-dashed border-stone-100 rounded-[2rem] md:rounded-[3rem]">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
              <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-stone-200" />
            </div>
            <h3 className="font-serif text-xl md:text-2xl text-stone-400 mb-3 italic font-light">The floor is yours...</h3>
            <p className="text-stone-300 text-[10px] uppercase tracking-[0.3em] font-bold">No reviews yet</p>
          </div>
        ) : (
          comments.map((comment) => {
            const detectedBadges = extractContext(comment.content);
            const level = getContributorLevel(comment.total_activity || 0);

            return (
              <div key={comment.id} className="group relative">
                <div className="flex flex-col md:flex-row gap-4 md:gap-10 items-start">
                  {/* User Column / Header on Mobile */}
                  <div className="w-full md:w-auto shrink-0 flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-0 group/avatar">
                    <div className="relative p-0.5 md:p-1 rounded-full border border-stone-100 bg-white shadow-sm group-hover/avatar:border-stone-200 transition-all duration-500">
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden bg-stone-50 relative z-10">
                        {comment.avatar_url ? (
                          <img src={comment.avatar_url} alt="User" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 font-serif text-base md:text-xl">
                            {comment.user_name?.[0]}
                          </div>
                        )}
                      </div>
                      
                      {comment.is_owner && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20" title="Verified Owner">
                          <CheckCircle2 className="w-2 h-2 md:w-2.5 md:h-2.5 text-stone-900" />
                        </div>
                      )}
                    </div>

                    {/* Mobile-only name & info display - now more compact */}
                    <div className="md:hidden flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif text-base text-stone-900">{comment.user_name}</span>
                            {comment.is_verified && (
                              <span title="Verified Scentia Member">
                                <ShieldCheck size={12} className="text-stone-300" />
                              </span>
                            )}
                          </div>
                          <div className={`text-[7px] font-bold uppercase tracking-[0.2em] ${level.color}`}>
                            {level.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-stone-300">
                          <Clock size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-widest pt-0.5">
                            {mounted ? formatRelativeTime(comment.created_at) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Column */}
                  <div className="flex-1 w-full pt-0 md:pt-1">
                    <div className="flex items-center justify-between gap-4 mb-3 md:mb-5">
                      <div className="flex items-center gap-x-3">
                        <div className="hidden md:flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-lg text-stone-900">{comment.user_name}</span>
                            {comment.is_verified && (
                              <span title="Verified Scentia Member">
                                <ShieldCheck size={14} className="text-stone-300" />
                              </span>
                            )}
                          </div>
                          <div className={`text-[7px] font-bold uppercase tracking-[0.2em] ${level.color} mt-0.5`}>
                            {level.name}
                          </div>
                        </div>
                        <div className="hidden md:block w-0.5 h-0.5 bg-stone-200 rounded-full" />
                        <div className="hidden md:flex items-center gap-1.5 text-stone-300">
                          <Clock size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-widest pt-0.5">
                            {mounted ? formatRelativeTime(comment.created_at) : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         <button className="p-2 hover:bg-stone-50 rounded-lg text-stone-300 hover:text-stone-600 transition-all"><Flag size={14} /></button>
                         {user?.id === comment.user_id && (
                           <>
                             <button className="p-2 hover:bg-stone-50 rounded-lg text-stone-300 hover:text-stone-600 transition-all"><Edit2 size={14} /></button>
                             <button className="p-2 hover:bg-red-50 rounded-lg text-stone-300 hover:text-red-600 transition-all"><Trash2 size={14} /></button>
                           </>
                         )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-100 transition-all duration-500 mb-6 md:mb-8 relative overflow-hidden">
                      {/* Decorative Quote Mark */}
                      <div className="absolute top-4 left-4 md:top-6 md:left-6 text-stone-50 opacity-20 pointer-events-none">
                        <Quote className="w-8 h-8 md:w-16 md:h-16" fill="currentColor" />
                      </div>
                      
                      <div className="relative z-10 prose prose-stone max-w-none font-serif text-stone-700 leading-relaxed text-base md:text-lg">
                        <FormattedText text={comment.content} />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 px-2 md:px-4">
                      {detectedBadges.map((badge, i) => (
                        <span key={i} className={`text-[8px] md:text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full border flex items-center gap-1.5 md:gap-2 transition-all hover:scale-105 ${badge.color}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      ))}
                    </div>
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
