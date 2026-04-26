import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  if (typeof window === 'undefined') {
    console.warn('⚠️ Supabase URL or Anon Key is missing during server-side execution.');
  }
}
