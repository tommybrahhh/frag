import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if keys are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Supabase keys are missing from .env.local');
}

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};