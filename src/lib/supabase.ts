import { createClient as createBrowserClient } from '@/utils/supabase/client';

export const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

// For backward compatibility with Client Components.
// Server Components should import from '@/utils/supabase/server' instead.
export const createClient = () => {
  return createBrowserClient();
};
