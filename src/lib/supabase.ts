// src/lib/supabase.ts

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 1. USE FALLBACKS (Don't crash if keys are missing during build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Variable to hold the single client instance in the browser
let clientInstance: ReturnType<typeof createSupabaseClient> | undefined;

// =================================================================
// FIX: Custom fetch with increased timeout (20 seconds)
// This directly addresses the "Auth timeout" error by giving network
// requests more time to complete, which is crucial for cold starts.
// =================================================================
const customFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  // Set a 20 second timeout (20000 milliseconds)
  const timeout = 20000; 
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  // Use the controller for the request and pass it the original signal if it exists
  const fetchOptions = {
    ...init,
    signal: init?.signal || controller.signal,
  };

  return fetch(input, fetchOptions).finally(() => {
    clearTimeout(id);
  });
};

// Configuration options to pass to createSupabaseClient, including the custom fetch
const clientOptions = {
  global: {
    fetch: customFetch,
  },
};

// EXPORT ADDED: Checks if the environment variables have been set.
export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co';


export const createClient = () => {
  // 2. RUNTIME CHECK (Optional: Warn only in browser console, don't crash build)
  if (typeof window !== 'undefined' && !isSupabaseConfigured) {
    console.warn('⚠️ Supabase URL is missing! Check your Vercel Environment Variables.');
    console.debug('Current Supabase configuration:', {
      url: supabaseUrl,
      key: supabaseKey ? '***' : 'missing',
      isConfigured: isSupabaseConfigured
    });
  }

  // 3. SINGLETON PATTERN (Browser)
  if (typeof window !== 'undefined') {
    if (!clientInstance) {
      // Pass the client options including the custom fetch
      clientInstance = createSupabaseClient(supabaseUrl, supabaseKey, clientOptions);
    }
    return clientInstance;
  }

  // 4. SERVER INSTANCE
  // Pass the client options including the custom fetch
  return createSupabaseClient(supabaseUrl, supabaseKey, clientOptions);
};
