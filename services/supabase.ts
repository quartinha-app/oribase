import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug Logs
console.log('--- SUPABASE CONFIG DEBUG ---');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Loaded' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Loaded' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables! Check .env.local');
}

// Create client with fallback values to prevent crash, but auth will fail if keys are missing
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
