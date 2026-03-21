'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateBlogPost(id: string, formData: FormData) {
  const supabase = await createClient();

  // 1. Check Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // 2. Fetch the post to check ownership
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('author_id, slug')
    .eq('id', id)
    .single();

  if (fetchError || !post) {
    throw new Error('Post not found');
  }

  // 3. Verify ownership
  if (post.author_id !== user.id) {
    throw new Error('Unauthorized: You are not the author of this post');
  }

  // 4. Extract data from formData
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const image_url = formData.get('image_url') as string;
  const slug = formData.get('slug') as string;

  // 5. Update the post
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({
      title,
      content,
      excerpt,
      image_url,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update post: ${updateError.message}`);
  }

  // 6. Revalidate cache
  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  if (slug !== post.slug) {
    revalidatePath(`/blog/${slug}`);
  }

  return { success: true, slug };
}
