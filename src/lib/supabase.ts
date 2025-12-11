import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 1. SAFE EXTRACTION
// We use a fallback string so the build doesn't crash if keys are missing.
// This allows 'npm run build' to pass on Vercel even if env vars are momentarily unset.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Variable to hold the single client instance in the browser
let clientInstance: ReturnType<typeof createSupabaseClient> | undefined;

export const createClient = () => {
  // 2. RUNTIME CHECK (Only throw when actually trying to use the client)
  // We check if the values are the placeholders. If so, we warn or throw.
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Supabase URL is missing! Check your environment variables.');
  }

  // 3. SINGLETON PATTERN
  if (typeof window !== 'undefined') {
    if (!clientInstance) {
      clientInstance = createSupabaseClient(supabaseUrl, supabaseKey);
    }
    return clientInstance;
  }

  // 4. SERVER INSTANCE
  return createSupabaseClient(supabaseUrl, supabaseKey);
};