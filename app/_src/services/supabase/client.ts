import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './types';

const SUPABASE_URL = 'https://bmhtjxhrhedlopicvcaf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaHRqeGhyaGVkbG9waWN2Y2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzU1NTIsImV4cCI6MjA3MTYxMTU1Mn0.uPrzXJ6unGCqzabnEZ-EFYkPFTTahPNetGMwKQgAg2I';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});


