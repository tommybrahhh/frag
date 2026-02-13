'use client';

import Link from 'next/link';
import { formatRelativeTime } from '@/utils/timeUtils';

// Simplified type for the comment data passed from the server
type UserComment = {
  id: string;
  created_at: string;
  content: string;
  perfume_id: string;
  perfume_name: string;
  perfume_image_url: string | null;
  brand_name: string;
};

interface UserCommentsListProps {
  initialData: UserComment[];
}

export default function UserCommentsList({ initialData = [] }: UserCommentsListProps) {
  // The component is now "dumb" and just receives data to render.
  // All data fetching is done on the server.

  if (initialData.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
        <h3 className="font-serif text-xl text-stone-400 mb-4">No reviews yet</h3>
        <p className="text-stone-500 mb-6">Start reviewing fragrances to see them here.</p>
        <Link href="/" className="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-700 transition">
          Find a Scent to Review
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {initialData.map((comment) => (
        <div key={comment.id} className="bg-white rounded-xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-start gap-4 mb-4">
            <Link href={`/perfume/${comment.perfume_id}`} className="flex-shrink-0 group">
              <div className="w-16 h-16 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-center p-1 overflow-hidden">
                {comment.perfume_image_url ? (
                  <img src={comment.perfume_image_url} alt={comment.perfume_name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                ) : (
                  <span className="text-xs text-stone-300">No Img</span>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/perfume/${comment.perfume_id}`} className="block">
                <h4 className="font-serif text-lg text-stone-900 truncate hover:text-stone-600 transition-colors">
                  {comment.perfume_name || 'Unknown Perfume'}
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate">
                  {comment.brand_name || 'Unknown Brand'}
                </p>
              </Link>
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-2">
                {formatRelativeTime(comment.created_at)}
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-stone-600 text-sm leading-relaxed font-serif line-clamp-4">
              {comment.content}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-between">
            {/* Upvote count was removed for simplicity in the new RPC function, can be added back if needed */}
            <div/>
            <Link href={`/perfume/${comment.perfume_id}`} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
              View Thread →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
