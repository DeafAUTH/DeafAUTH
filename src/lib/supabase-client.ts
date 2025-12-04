'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// For static builds/GitHub Pages, we need runtime configuration
// Environment variables are baked in at build time in Next.js static export
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if we have valid configuration
// This allows the build to succeed even without env vars
const createSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing. Authentication features will not work.');
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabaseClient = createSupabaseClient();
