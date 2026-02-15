import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cache server client singleton to avoid creating a new client on every call
let serverClient: SupabaseClient | null | undefined;

// Backend client with service role key (for secure server-side operations)
// This bypasses Row Level Security and has full access
export function getSupabaseServerClient() {
  if (serverClient !== undefined) return serverClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("[Supabase] Server credentials not configured - logging disabled");
    serverClient = null;
    return null;
  }

  serverClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return serverClient;
}

// Frontend client with anon key (for client-side action logging)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not configured - logging disabled");
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
