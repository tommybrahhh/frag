import { createClient as createBrowserClient } from '@/utils/supabase/client';

// Re-export the client creation function
// This file acts as a bridge for the older import path '@/lib/supabase'
export const createClient = createBrowserClient;
