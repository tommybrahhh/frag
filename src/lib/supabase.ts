import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 1. USE FALLBACKS (Don't crash if keys are missing during build)
// If the env var is missing, we use a string. This satisfies the build process.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Variable to hold the single client instance in the browser
let clientInstance: ReturnType<typeof createSupabaseClient> | undefined;

export const createClient = () => {
  // 2. RUNTIME CHECK (Optional: Warn only in browser console, don't crash build)
  if (typeof window !== 'undefined' && supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ Supabase URL is missing! Check your Vercel Environment Variables.');
  }

  // 3. SINGLETON PATTERN (Browser)
  if (typeof window !== 'undefined') {
    if (!clientInstance) {
      clientInstance = createSupabaseClient(supabaseUrl, supabaseKey);
    }
    return clientInstance;
  }

  // 4. SERVER INSTANCE
  return createSupabaseClient(supabaseUrl, supabaseKey);
};