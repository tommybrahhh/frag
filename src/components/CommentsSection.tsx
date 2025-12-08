'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function CommentsSection({ perfumeId }: { perfumeId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Load Comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('perfume_id', perfumeId)
        .order('created_at', { ascending: false });
      setComments(data || []);
    };
    fetchComments();
  }, [perfumeId]);

  // Submit Comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      perfume_id: perfumeId,
      content: newComment,
      user_name: user.email?.split('@')[0] || 'Member'
    });

    if (!error) {
      setNewComment('');
      // Refresh list
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('perfume_id', perfumeId)
        .order('created_at', { ascending: false });
      setComments(data || []);
    }
    setLoading(false);
  };

  // Delete Comment
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    await supabase.from('comments').delete().eq('id', id);
    setComments(comments.filter(c => c.id !== id));
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
                    disabled={loading || !newComment.trim()}
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
              {/* Optional: Sort filter could go here */}
            </div>

            <div className="space-y-8">
              {comments.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-stone-200 rounded-2xl">
                  <div className="text-2xl mb-2 text-stone-300">✎</div>
                  <p className="text-stone-400 italic text-sm">Be the first to review this scent.</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="group relative">
                    {/* Delete Button (Hover) */}
                    {user?.id === c.user_id && (
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        className="absolute top-0 right-0 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-2"
                        title="Delete Review"
                      >
                        ✕
                      </button>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500 uppercase">
                        {c.user_name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900">{c.user_name}</div>
                        <div className="text-[10px] text-stone-400 uppercase tracking-wide">
                          {new Date(c.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pl-11">
                      <p className="text-stone-700 text-sm leading-7 font-serif">
                        {c.content}
                      </p>
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