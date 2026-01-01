'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Database } from '@/types/database';

export default function CommentsSection({ perfumeId }: { perfumeId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const supabase = createClient();

  // New states for editing comments
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);


  // Load Comments
  const fetchComments = async () => {
    setPostError(null); // Clear errors when refetching comments

    // Step 1: Fetch comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*') // Fetch all columns from comments
      .eq('perfume_id', perfumeId)
      .order('created_at', { ascending: false }) as { data: Database['public']['Tables']['comments']['Row'][] | null, error: any };

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      setComments([]);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      return;
    }

    // Step 2: Extract unique user_ids from commentsData
    const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

    // Step 3: Fetch profile data for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar_url, is_verified') // Fetch only necessary profile fields
      .in('id', userIds) as { data: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'avatar_url' | 'is_verified'>[] | null, error: any };

    if (profilesError) {
      console.error('Error fetching profiles for comments:', profilesError);
      // Proceed with comments but without profile data if this fails
      setComments(commentsData.map(comment => ({ ...comment, profile: null })));
      return;
    }

    // Step 4: Create a map of profiles for easy lookup
    const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]));

    // Step 5: Augment comments with profile data
    const augmentedComments = commentsData.map(comment => ({
      ...comment,
      profile: profilesMap.get(comment.user_id) || null, // Attach profile or null if not found
    }));

    setComments(augmentedComments);
  };

  useEffect(() => {
    fetchComments();
  }, [perfumeId]);

  // Submit Comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setPostError("You must be logged in to post a comment.");
      return;
    }
    if (!newComment.trim()) {
      setPostError("Comment cannot be empty.");
      return;
    }

    setLoading(true);
    setPostError(null); // Clear previous errors

    try {
      // Use explicit type for insert to leverage Database type
      const commentToInsert: Database['public']['Tables']['comments']['Insert'] = {
        user_id: user.id,
        perfume_id: perfumeId,
        content: newComment,
        user_name: user.display_name || user.email?.split('@')[0] || 'Member', // Use display_name if available
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('comments').insert(commentToInsert as any);

      if (insertError) {
        console.error('Supabase Insert Error:', insertError); // Log the full error object
        throw insertError; // Re-throw to be caught by the outer try/catch
      }

      setNewComment('');
      await fetchComments(); // Re-fetch comments after successful post
      // No need to setLoading(false) here, it's in finally
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setPostError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setLoading(false); // Ensure loading is reset on error or success
    }
  };

  // Delete Comment
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await supabase.from('comments').delete().eq('id', id);
      setComments(comments.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      // You might want to display this error to the user
      alert('Failed to delete comment: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle Edit Click
  const handleEditClick = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditedCommentContent(comment.content);
    setEditError(null); // Clear previous edit errors
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentContent('');
    setEditError(null);
  };

  // Handle Save Edit
  const handleSaveEdit = async (commentId: string) => {
    if (!user || !editedCommentContent.trim()) {
      setEditError("Edited comment cannot be empty.");
      return;
    }
    setIsSavingEdit(true);
    setEditError(null);

    try {
      const { error } = await (supabase
        .from('comments') as any)
        .update({ content: editedCommentContent }) // Removed created_at from update payload
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure only the owner can update

      if (error) throw error;

      setEditingCommentId(null);
      setEditedCommentContent('');
      await fetchComments(); // Refresh comments list
    } catch (err: any) {
      console.error('Error saving edited comment:', err);
      setEditError(err.message || 'Failed to save comment changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 mt-20 mb-24">
      {/* Main Container: Matches 'Tech Deck' Style */}
      <div className="bg-stone-50 rounded-3xl p-8 md:p-12 border border-stone-100">
        
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: The Input (Sticky) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <h3 className="font-serif text-3xl text-stone-900 mb-4">Community Notes</h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                Join the olfactory conversation. Share your experience, layering tips, or longevity reports.
              </p>

              {user ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {postError && ( // Display post error message
                    <div className="text-red-500 text-xs mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      {postError}
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your review..."
                      className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:border-stone-800 outline-none transition text-sm min-h-[140px] resize-none shadow-sm placeholder:text-stone-300"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-stone-300 font-bold uppercase tracking-widest">
                      {newComment.length} chars
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || !newComment.trim()} // Disable button while loading or empty
                    className="w-full py-4 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-stone-100 text-center shadow-sm">
                  <p className="text-stone-400 text-xs uppercase tracking-widest mb-4">Members Only</p>
                  <Link href="/login" className="block w-full py-3 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition">
                    Log In to Post
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: The Feed */}
          <div className="lg:col-span-8 lg:border-l border-stone-200 lg:pl-12">
            
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {comments.length} {comments.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
            {editError && ( // Display edit error message
              <div className="text-red-500 text-xs mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                {editError}
              </div>
            )}
            <div className="space-y-8">
              {comments.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-stone-200 rounded-2xl">
                  <div className="text-2xl mb-2 text-stone-300">✎</div>
                  <p className="text-stone-400 italic text-sm">Be the first to review this scent.</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="group relative">
                    {user?.id === c.user_id && (
                      <div className="absolute top-0 right-0 flex space-x-2 opacity-0 group-hover:opacity-100 transition p-2">
                        {/* Edit Button */}
                        <button 
                          onClick={() => handleEditClick(c)} 
                          className="text-stone-400 hover:text-stone-600"
                          title="Edit Review"
                        >
                          ✎
                        </button>
                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDelete(c.id)} 
                          className="text-stone-300 hover:text-red-400"
                          title="Delete Review"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
                        {c.profile?.avatar_url ? (
                          <img src={c.profile.avatar_url} alt={c.user_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-stone-500 uppercase">{c.user_name[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          {c.user_name}
                          {c.profile?.is_verified && (
                                                          <svg 
                                                            xmlns="http://www.w3.org/2000/svg" 
                                                            viewBox="0 0 20 20" 
                                                            fill="currentColor" 
                                                            className="w-4 h-4 text-sky-500"
                                                          >
                                                            <title>Verified Reviewer</title>
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                          </svg>                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase tracking-wide">
                          {new Date(c.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pl-11">
                      {editingCommentId === c.id ? (
                        // Edit Mode
                        <div className="space-y-2">
                          <textarea
                            value={editedCommentContent}
                            onChange={(e) => setEditedCommentContent(e.target.value)}
                            className="w-full p-2 border border-stone-200 rounded-md focus:ring-0 focus:border-stone-400 outline-none text-sm resize-none min-h-[100px]"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 text-sm border border-stone-300 rounded-md hover:bg-stone-100 transition"
                              disabled={isSavingEdit}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(c.id)}
                              className="px-4 py-2 text-sm bg-stone-900 text-white rounded-md hover:bg-stone-700 transition disabled:opacity-50"
                              disabled={isSavingEdit || !editedCommentContent.trim()}
                            >
                              {isSavingEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <p className="text-stone-700 text-sm leading-7 font-serif whitespace-pre-wrap">
                          {c.content}
                        </p>
                      )}
                    </div>

                    {/* Separator */}
                    <div className="mt-8 border-b border-stone-100 w-full" />
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