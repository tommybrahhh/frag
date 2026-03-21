'use client';

import { useState } from 'react';
import { updateBlogPost } from '@/lib/actions/blog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EditBlogFormProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    image_url: string | null;
  };
}

export default function EditBlogForm({ post }: EditBlogFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    try {
      const result = await updateBlogPost(post.id, formData);
      if (result.success) {
        router.push(`/blog/${result.slug}`);
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={post.title}
          required
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          defaultValue={post.slug}
          required
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
          Excerpt (Short Description)
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          defaultValue={post.excerpt || ''}
          rows={2}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all resize-none"
        />
      </div>

      <div>
        <label htmlFor="image_url" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
          Image URL
        </label>
        <input
          type="text"
          id="image_url"
          name="image_url"
          defaultValue={post.image_url || ''}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
          Content (HTML)
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={post.content}
          required
          rows={15}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-stone-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isPending ? 'Saving Changes...' : 'Save Changes'}
        </button>
        <Link
          href={`/blog/${post.slug}`}
          className="px-8 py-4 border border-stone-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
