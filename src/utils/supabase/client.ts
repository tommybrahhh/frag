import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export const createClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabase = createClient()

if (!supabase) {
  throw new Error('Supabase client failed to initialize')
}