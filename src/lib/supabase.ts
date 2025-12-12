import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 1. USE FALLBACKS (Don't crash if keys are missing during build)
// If the env var is missing, we use a string. This satisfies the build process.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Variable to hold the single client instance in the browser
let clientInstance: ReturnType<typeof createSupabaseClient> | undefined;

export const createClient = () => {
  // 2. RUNTIME CHECK (Optional: Warn only in browser console, don't crash build)
  if (typeof window !== 'undefined' && !isSupabaseConfigured) {
    console.warn('⚠️ Supabase URL is missing! Check your Vercel Environment Variables.');
  }

  // 3. SINGLETON PATTERN (Browser)
  if (typeof window !== 'undefined') {
    if (!clientInstance) {
      console.log('🆕 Creating new Supabase client instance', {
        url: supabaseUrl?.slice(0, 20) + '...',
        key: supabaseKey?.slice(0, 6) + '...',
        isConfigured: isSupabaseConfigured,
        envVarsPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        windowDefined: typeof window !== 'undefined'
      });
      clientInstance = createSupabaseClient(supabaseUrl, supabaseKey, clientOptions);
    }
    return clientInstance;
  }

  // 4. SERVER INSTANCE
  return createSupabaseClient(supabaseUrl, supabaseKey, clientOptions);
};

// =================================================================
// FIX: Custom fetch with increased timeout (10 seconds)
// This directly addresses the "Auth timeout" error by giving network
// requests more time to complete, which is crucial for cold starts.
// =================================================================
const customFetch: typeof fetch = (url: RequestInfo | URL, options?: RequestInit) => {
  console.log('🌐 Fetch request initiated:', {
    url: url.toString().slice(0, 50),
    method: options?.method || 'GET', // Safe access with optional chaining
    timeout: 10000
  });
  
  const timeout = 10000;
  const controller = new AbortController();
  const id = setTimeout(() => {
    console.warn('⏰ Fetch timeout triggered (10s) for URL:', {
      url: typeof url === 'string' ? url : url.href,
      supabaseInitTime: performance.now() - window.supabaseInitStart
    });
    controller.abort();
  }, timeout);
  
  // Use the controller for the request and pass it the original signal
  const fetchOptions = {
    ...options,
    signal: options?.signal || controller.signal, // Safe access with optional chaining
  };

  return fetch(url, fetchOptions).finally(() => {
    clearTimeout(id);
  });
};

// Configuration options to pass to createSupabaseClient
const clientOptions = {
  global: {
    fetch: customFetch,
  },
};

// Add type declaration for window property
declare global {
  interface Window {
    supabaseInitStart: number;
  }
}

export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co';
