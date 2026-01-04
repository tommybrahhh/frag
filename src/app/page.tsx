import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/features/home/HomeClient';

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

  return <HomeClient initialBlogPosts={blogPosts || []} />;
}