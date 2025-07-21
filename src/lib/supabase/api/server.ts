import { createClient } from '@supabase/supabase-js';

export const supabaseServer = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!
); 