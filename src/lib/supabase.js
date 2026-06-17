import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zasxtetwwvmntqaarqpi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphc3h0ZXR3d3ZtbnRxYWFycXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTg3MzEsImV4cCI6MjA5NzAzNDczMX0.sUE3oW0kYxbxLeCvEA-Z8imvOmXS2cx3j8dHLgQEqPM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
