import { createClient, SupabaseClient } from "@supabase/supabase-js";

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export const supabaseAdmin: SupabaseClient = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
