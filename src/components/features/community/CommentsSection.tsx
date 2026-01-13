'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Database } from '@/types/database';

type EnrichedComment = Database['public']['Tables']['comments']['Row'] & {
  upvote_count: number;
  user_has_upvoted: boolean;
  profile: {
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
};

export default function CommentsSection({ perfumeId }: { perfumeId: string }) {
  const { user, supabase } = useAuth();
  const [comments, setComments] = useState<EnrichedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<'created_at' | 'upvote_count'>('created_at');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    console.log('CommentsSection: fetchComments started', { perfumeId, sortOrder });
    setIsFeedLoading(true);
    setFeedError(null);
    try {
      if (!supabase) {
        console.warn('CommentsSection: Supabase client is not available');
        throw new Error('Supabase client not initialized');
      }

      // 1. Fetch Comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('perfume_id', perfumeId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const commentIds = commentsData.map((c: any) => c.id);
      const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)));

      // 1b. Fetch Profiles (Manual Join)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, avatar_url, is_verified')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // 2. Fetch All Upvotes for these comments to calculate counts
      // Note: For very popular items, a 'count' aggregation view would be better, 
      // but for now we fetch the IDs which is lighter than full rows.
      const { data: allUpvotes, error: upvotesError } = await supabase
        .from('comment_upvotes')
        .select('comment_id, user_id') // We need user_id to check if current user upvoted too
        .in('comment_id', commentIds);

      if (upvotesError) throw upvotesError;

      // 3. Process Upvotes (Count & User Status)
      const upvoteCounts: Record<string, number> = {};
      const userUpvoted: Record<string, boolean> = {};

      allUpvotes?.forEach((u: any) => {
        upvoteCounts[u.comment_id] = (upvoteCounts[u.comment_id] || 0) + 1;
        if (user && u.user_id === user.id) {
          userUpvoted[u.comment_id] = true;
        }
      });

      // 4. Merge Data
      let enrichedComments = commentsData.map((c: any) => ({
        ...c,
        profile: profilesMap[c.user_id] || null,
        upvote_count: upvoteCounts[c.id] || 0,
        user_has_upvoted: !!userUpvoted[c.id]
      }));

      // 5. Apply Sorting (if not default created_at)
      if (sortOrder === 'upvote_count') {
        enrichedComments.sort((a, b) => b.upvote_count - a.upvote_count);
      }

      setComments(enrichedComments as EnrichedComment[]);

    } catch (error: any) {
      console.error('Error fetching comments:', error);
      setComments([]);
      setFeedError('Failed to load comments. Please try again later.');
    } finally {
      setIsFeedLoading(false);
    }
  }, [perfumeId, sortOrder, supabase, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setPostError("You must be logged in to post a comment."); return; }
    if (!supabase) { setPostError("System error: Supabase client not initialized."); return; }
    if (!newComment.trim()) { setPostError("Comment cannot be empty."); return; }

    setIsSubmitting(true);
    setPostError(null);

    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        perfume_id: perfumeId,
        content: newComment,
        user_name: user.display_name || user.email?.split('@')[0] || 'Member',
      });

      if (error) throw error;
      
      setNewComment('');
      await fetchComments();
    } catch (error: any) {
      console.error('Error posting comment:', error);
      setPostError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    await supabase.from('comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    setDeletingCommentId(null);
  };

  const handleEditClick = (comment: EnrichedComment) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
    setEditError(null);
    setActiveMenu(null);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!user || !editedCommentContent.trim()) {
      setEditError("Comment cannot be empty.");
      return;
    }
    if (!supabase) {
        setEditError("System error: Supabase client not initialized.");
        return;
    }
    setIsSavingEdit(true);
    setEditError(null);

    const originalComments = [...comments];
    const newContent = editedCommentContent;

    // Optimistically update the UI
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, content: newContent } : c
    ));
    setEditingCommentId(null);

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: newContent })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        // Revert on error
        setComments(originalComments);
        setEditingCommentId(commentId); // Re-open edit mode
        throw error;
      }
    } catch (error: any) {
      setEditError(error.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleUpvote = async (comment: EnrichedComment) => {
    if (!user || !supabase) return;
    const hasUpvoted = comment.user_has_upvoted;
    const newUpvoteCount = hasUpvoted ? comment.upvote_count - 1 : comment.upvote_count + 1;
    setComments(prev => prev.map(c => 
      c.id === comment.id 
        ? { ...c, user_has_upvoted: !hasUpvoted, upvote_count: newUpvoteCount } 
        : c
    ));
    if (hasUpvoted) {
      await supabase.from('comment_upvotes').delete().match({ comment_id: comment.id, user_id: user.id });
    } else {
      await supabase.from('comment_upvotes').insert({ comment_id: comment.id, user_id: user.id });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 mt-20 mb-24">
      <div className="bg-stone-50 rounded-3xl p-8 md:p-12 border border-stone-100">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <h3 className="font-serif text-3xl text-stone-900 mb-4">Community Notes</h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">Join the olfactory conversation. Share your experience, layering tips, or longevity reports.</p>
              {user ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {postError && ( <div className="text-red-500 text-xs mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">{postError}</div> )}
                  <div className="relative"><textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write your review..." className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:border-stone-800 outline-none transition text-sm min-h-[140px] resize-none shadow-sm placeholder:text-stone-300" /><div className="absolute bottom-3 right-3 text-[10px] text-stone-300 font-bold uppercase tracking-widest">{newComment.length} chars</div></div>
                  <button type="submit" disabled={isSubmitting || !newComment.trim()} className="w-full py-4 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition disabled:opacity-50 flex justify-center items-center gap-2">{isSubmitting ? 'Posting...' : 'Post Review'}</button>
                </form>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-stone-100 text-center shadow-sm"><p className="text-stone-400 text-xs uppercase tracking-widest mb-4">Members Only</p><Link href="/login" className="block w-full py-3 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition">Log In to Post</Link></div>
              )}
            </div>
          </div>
          <div className="lg:col-span-8 lg:border-l border-stone-200 lg:pl-12">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{comments.length} {comments.length === 1 ? 'Review' : 'Reviews'}</span>
              <div className="flex items-center gap-4 text-xs"><span className="text-stone-500">Sort by:</span><button onClick={() => setSortOrder('created_at')} className={`font-bold transition ${sortOrder === 'created_at' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-900'}`}>Newest</button><button onClick={() => setSortOrder('upvote_count')} className={`font-bold transition ${sortOrder === 'upvote_count' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-900'}`}>Popular</button></div>
            </div>
            {editError && ( <div className="text-red-500 text-xs mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">{editError}</div> )}
            {feedError && ( <div className="text-red-500 text-xs mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">{feedError}</div> )}
            <div className="space-y-6">
              {isFeedLoading && comments.length === 0 ? <p className="text-stone-400">Loading reviews...</p> : null}
              {!isFeedLoading && comments.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-stone-200 rounded-2xl"><div className="text-2xl mb-2 text-stone-300">✎</div><p className="text-stone-400 italic text-sm">Be the first to review this scent.</p></div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center overflow-hidden">{c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt={c.user_name || 'avatar'} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-stone-500 uppercase">{c.user_name?.[0]}</span>}</div>
                        <div>
                          <div className="text-sm font-bold text-stone-900 flex items-center gap-1.5">{c.user_name} {c.profile?.is_verified && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-sky-500"><title>Verified Reviewer</title><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>}</div>
                          <div className="text-xs text-stone-400">{new Date(c.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</div>
                        </div>
                      </div>
                      {user?.id === c.user_id && (
                        <div className="relative">
                          <button onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)} className="p-2 text-stone-400 hover:text-stone-700"><img src="/icons/dots-vertical.svg" alt="Menu" className="w-4 h-4" /></button>
                          {activeMenu === c.id && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 w-32"><button onClick={() => handleEditClick(c)} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">Edit</button><button onClick={() => { setDeletingCommentId(c.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Delete</button></div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      {editingCommentId === c.id ? (
                        <div className="space-y-2">
                          <textarea value={editedCommentContent} onChange={(e) => setEditedCommentContent(e.target.value)} className="w-full p-2 border border-stone-200 rounded-md focus:ring-0 focus:border-stone-400 outline-none text-sm resize-none min-h-[100px]" />
                          <div className="flex justify-end space-x-2"><button onClick={handleCancelEdit} className="px-4 py-2 text-sm border border-stone-300 rounded-md hover:bg-stone-100 transition" disabled={isSavingEdit}>Cancel</button><button onClick={() => handleSaveEdit(c.id)} className="px-4 py-2 text-sm bg-stone-900 text-white rounded-md hover:bg-stone-700 transition disabled:opacity-50" disabled={isSavingEdit || !editedCommentContent.trim()}>{isSavingEdit ? 'Saving...' : 'Save'}</button></div>
                        </div>
                      ) : ( <p className="text-stone-700 text-sm leading-relaxed font-serif whitespace-pre-wrap">{c.content}</p> )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <button onClick={() => handleUpvote(c)} disabled={!user} className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors group/upvote disabled:opacity-60 ${c.user_has_upvoted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100 hover:border-stone-300'}`}>
                        <img src={c.user_has_upvoted ? '/icons/heart-solid.svg' : '/icons/heart-outline.svg'} alt="Upvote" className={`w-4 h-4 transition-all ${c.user_has_upvoted ? 'text-red-500' : 'text-stone-400 group-hover/upvote:text-stone-600'}`} />
                        <span className="text-xs font-bold">{c.upvote_count}</span>
                      </button>
                      {deletingCommentId === c.id && (
                        <div className="flex items-center gap-2"><span className="text-xs text-red-500">Delete this note?</span><button onClick={() => handleDelete(c.id)} className="text-xs font-bold text-red-600 hover:underline">Yes, delete</button><button onClick={() => setDeletingCommentId(null)} className="text-xs text-stone-500 hover:underline">Cancel</button></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
