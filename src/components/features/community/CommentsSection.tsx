'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Database } from '@/types/database';
import { createClient } from '@/utils/supabase/client';

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------

type EnrichedComment = Database['public']['Tables']['comments']['Row'] & {
  is_owner: boolean; // Calculated from user_collections
  profile: {
    avatar_url: string | null;
    is_verified: boolean | null; // For the Blue Tick
  } | null;
};

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
  
  const [comments, setComments] = useState<EnrichedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    setIsFeedLoading(true);
    try {
      // 1. Fetch Comments
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('perfume_id', perfumeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)));

      // 2. Fetch Profiles (for Avatar and Verified User status)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url, is_verified')
        .in('id', userIds);
      
      // 3. Check Ownership (for Verified Owner status)
      const { data: ownershipData } = await supabase
        .from('user_collections')
        .select('user_id')
        .eq('perfume_id', perfumeId)
        .eq('list_type', 'owned')
        .in('user_id', userIds);

      const ownersSet = new Set(ownershipData?.map(o => o.user_id));
      
      const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // 4. Merge Data
      let enriched = commentsData.map((c: any) => ({
        ...c,
        profile: profilesMap[c.user_id] || null,
        is_owner: ownersSet.has(c.user_id)
      }));

      setComments(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFeedLoading(false);
    }
  }, [perfumeId, supabase]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // --- EDITOR LOGIC ---
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
    setIsSubmitting(true);
    
    const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        perfume_id: perfumeId,
        content: newComment,
        user_name: user.display_name || 'Member', 
    });

    if (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    } else {
        setNewComment('');
        fetchComments();
    }
    setIsSubmitting(false);
  };

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6 mt-16 mb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-stone-200 pb-6">
        <div>
          <h3 className="font-serif text-3xl text-stone-900 mb-2">Community Notes</h3>
          <p className="text-stone-500 text-sm max-w-md">
            Real experiences from the collector community.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* INPUT FORM (Sticky) */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 sticky top-24">
            <h4 className="font-serif text-lg text-stone-800 mb-4">Add your note</h4>
            {user ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* TOOLBAR */}
                <div className="flex items-center gap-1 mb-2 border-b border-stone-200 pb-2">
                  <button type="button" onClick={() => insertFormat('**', '**')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-200 text-stone-600 font-bold" title="Bold">B</button>
                  <button type="button" onClick={() => insertFormat('*', '*')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-200 text-stone-600 italic font-serif" title="Italic">I</button>
                  <button type="button" onClick={() => insertFormat('> ', '')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-200 text-stone-600" title="Quote">❞</button>
                </div>

                <textarea 
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Does it last? Is it safe for work? (Keywords like 'Office' or 'Date' are auto-tagged)"
                  className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm min-h-[140px] focus:ring-1 focus:ring-stone-900 outline-none resize-none shadow-sm placeholder:text-stone-400 font-serif"
                />
                
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newComment.trim()}
                  className="w-full py-3 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Note'}
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  Review marked as "Verified" if in your collection.
                </p>
              </form>
            ) : (
               <div className="text-center py-6">
                 <p className="text-stone-500 text-sm mb-4">Log in to contribute.</p>
                 <Link href="/login" className="inline-block px-6 py-2 border border-stone-300 rounded-full text-xs font-bold uppercase hover:bg-stone-900 hover:text-white transition">Log In</Link>
               </div>
            )}
          </div>
        </div>

        {/* FEED */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
          {isFeedLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-stone-50 animate-pulse rounded-xl" />)}</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-stone-100 rounded-2xl">
              <h3 className="font-serif text-xl text-stone-400">Quiet in here...</h3>
              <p className="text-stone-400 text-sm">Be the first to review this scent.</p>
            </div>
          ) : (
            comments.map((comment) => {
              const detectedBadges = extractContext(comment.content);

              return (
                <div key={comment.id} className="group relative bg-white p-6 sm:p-8 rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-sm transition duration-300">
                  
                  {/* USER HEADER */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-100 flex items-center justify-center">
                        {comment.profile?.avatar_url ? (
                          <img src={comment.profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-stone-400 font-bold text-xs">{comment.user_name?.[0]}</span>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{comment.user_name}</span>
                          
                          {/* BADGE 1: PROFILE VERIFIED (Blue Tick) */}
                          {comment.profile?.is_verified && (
                            <span title="Verified User" className="text-blue-500">
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                 <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" fillRule="evenodd"/>
                              </svg>
                            </span>
                          )}

                          {/* BADGE 2: VERIFIED OWNER (Amber Tag) */}
                          {comment.is_owner && (
                             <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 ml-1">
                               <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"/> Verified Owner
                             </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="prose prose-stone prose-sm max-w-none mb-6 font-serif text-stone-700 leading-relaxed text-[15px]">
                    <FormattedText text={comment.content} />
                  </div>

                  {/* AUTO-DETECTED TAGS */}
                  {detectedBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {detectedBadges.map((badge, i) => (
                        <span key={i} className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded bg-stone-50 text-stone-500 border border-stone-100`}>
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* FOOTER - ONLY EDIT (No Upvote to avoid 404) */}
                  <div className="flex items-center justify-end pt-4 border-t border-stone-50">
                    {user?.id === comment.user_id && (
                       <button className="text-[10px] font-bold uppercase text-stone-300 hover:text-stone-900 transition">
                         Edit Note
                       </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}