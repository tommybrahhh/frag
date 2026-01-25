import { createClient } from '@/utils/supabase/server';
import HomeClient from '@/components/features/home/HomeClient';
import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <HomeClient />
    </Suspense>
  );
}