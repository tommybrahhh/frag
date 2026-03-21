import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditBlogForm from '@/components/features/blog/EditBlogForm';
import Link from 'next/link';


interface PostData {
  author_id: string;
  [key: string]: any;
}

export default async function EditBlogPostPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = params.slug;
  const supabase = await createClient();

  // 1. Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch the post
  const { data, error: fetchError } = await (supabase as any)
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  const post = data as any;

  if (fetchError || !post) {
    notFound();
  }

  // 3. Check ownership
  if (post.author_id !== user.id) {
    redirect(`/blog/${slug}`);
  }

  return (
    <div className="min-h-screen bg-white text-stone-800 pb-24 pt-20 md:pt-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <Link
            href={`/blog/${slug}`}
            className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-stone-900 mb-8 inline-flex items-center gap-2 transition-colors"
          >
            <span className="text-lg">←</span> Back to Post
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-stone-200" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-stone-500">Editor</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-stone-900">
            Edit <span className="italic text-stone-400">Post</span>
          </h1>
        </div>

        <div className="bg-white border border-stone-100 rounded-3xl p-8 md:p-12 shadow-sm">
          <EditBlogForm post={post} />
        </div>
      </div>
    </div>
  );
}
