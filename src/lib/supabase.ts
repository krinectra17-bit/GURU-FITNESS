import { createClient } from '@supabase/supabase-js';

// Read Vite environment variables
const defaultProjectUrl = 'https://sbtzzuwmxwjxahvjyizt.supabase.co';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultProjectUrl;

// Support both VITE_SUPABASE_PUBLISHABLE_KEY (modern standard) and VITE_SUPABASE_ANON_KEY
const supabasePublishableKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabasePublishableKey && 
  supabasePublishableKey.trim() !== '' &&
  !supabasePublishableKey.includes('placeholder') &&
  !supabasePublishableKey.includes('<the publishable key') &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// If configured, initialize the real Supabase client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : (null as any);

export const SUPABASE_PROJECT_URL = supabaseUrl;
