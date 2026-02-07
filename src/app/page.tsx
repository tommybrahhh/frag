import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/features/home/HomeClient';
import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import { getPerfumes } from '@/lib/services/perfumeService';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  // Parallel data fetching for better performance
  const [commentsPromise, perfumesPromise] = [
    // 1. Fetch latest comments
    supabase
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
      .limit(3),

    // 2. Fetch initial perfumes (SSR)
    getPerfumes({ page: 1, limit: 24 })
  ];

  const [{ data: comments }, { data: perfumes }] = await Promise.all([
    commentsPromise,
    perfumesPromise
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <HomeClient 
        initialComments={comments || []} 
        initialPerfumes={(perfumes as any[]) || []} 
      />
    </Suspense>
  );
}