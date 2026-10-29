import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bfzbmbsmnlglmncgomvw.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemJtYnNtbmxnbG1uY2dvbXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5Mzc3NjQsImV4cCI6MjEwODUxMzc2NH0.uw2PslycX9SYduCK1EKpB4LxF5eqLlHDH-ppo_r1yNM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);