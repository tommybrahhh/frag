import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/features/home/HomeClient';
import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // Fetch blog posts on the server
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(2);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <HomeClient initialBlogPosts={blogPosts || []} />
    </Suspense>
  );
}
