import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/features/home/HomeClient';
import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // Fetch latest comments server-side for instant rendering
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      id,
      user_name,
      content,
      created_at,
      perfume_id,
      perfume:perfumes (
        name,
        image_url,
        slug,
        brand:brands ( name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <HomeClient initialComments={comments || []} />
    </Suspense>
  );
}