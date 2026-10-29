import { createClient } from '@supabase/supabase-js';

// Dapatkan SUPABASE_URL dan SUPABASE_ANON_KEY dari Dashboard Supabase kamu
const SUPABASE_URL = "https://bfzbmbsmnlglmncgomvw.supabase.co/rest/v1/"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);