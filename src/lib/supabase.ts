import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Variable to hold the single client instance in the browser
let clientInstance: ReturnType<typeof createSupabaseClient> | undefined;

export const createClient = () => {
  // 1. If running in the Browser, reuse the existing connection (Singleton)
  if (typeof window !== 'undefined') {
    if (!clientInstance) {
      clientInstance = createSupabaseClient(supabaseUrl, supabaseKey);
    }
    return clientInstance;
  }

  // 2. If running on the Server (API Routes), always create a fresh connection
  // (This prevents users from accidentally sharing data on the server)
  return createSupabaseClient(supabaseUrl, supabaseKey);
};