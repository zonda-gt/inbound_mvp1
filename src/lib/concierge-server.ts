import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase";

export type ConciergeThread = {
  id: string;
  anonymous_user_id: string | null;
  user_id: string | null;
  display_name: string | null;
  city: string | null;
  email: string | null;
  created_at: string;
  last_user_message_at: string | null;
  last_admin_message_at: string | null;
  admin_unread_count: number;
  user_unread_count: number;
  status: string;
};

export type ConciergeMessage = {
  id: string;
  thread_id: string;
  sender: "user" | "admin";
  content: string;
  created_at: string;
  read_at: string | null;
};

export type ThreadIdentity = {
  anonymousUserId?: string | null;
  userId?: string | null;
};

export function requireSupabase(): SupabaseClient {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

// Forward-compatible identity resolution. Today every request lands on the
// anonymousUserId branch; once LOGIN_ENABLED flips on the API routes can
// populate userId from the auth session and lookups will switch over without
// any other code changes.
export async function findThread(
  supabase: SupabaseClient,
  identity: ThreadIdentity,
): Promise<ConciergeThread | null> {
  if (identity.userId) {
    const { data } = await supabase
      .from("concierge_threads")
      .select("*")
      .eq("user_id", identity.userId)
      .maybeSingle();
    if (data) return data as ConciergeThread;
  }
  if (identity.anonymousUserId) {
    const { data } = await supabase
      .from("concierge_threads")
      .select("*")
      .eq("anonymous_user_id", identity.anonymousUserId)
      .maybeSingle();
    if (data) return data as ConciergeThread;
  }
  return null;
}

export async function getOrCreateThread(
  supabase: SupabaseClient,
  identity: ThreadIdentity,
  profile: { displayName?: string | null; city?: string | null; email?: string | null },
): Promise<ConciergeThread> {
  const existing = await findThread(supabase, identity);
  if (existing) {
    // Patch in newly-supplied profile fields without overwriting existing values.
    const patch: Partial<ConciergeThread> = {};
    if (profile.displayName && !existing.display_name) patch.display_name = profile.displayName;
    if (profile.city && !existing.city) patch.city = profile.city;
    if (profile.email && !existing.email) patch.email = profile.email;
    if (Object.keys(patch).length > 0) {
      const { data } = await supabase
        .from("concierge_threads")
        .update(patch)
        .eq("id", existing.id)
        .select("*")
        .single();
      return (data as ConciergeThread) ?? existing;
    }
    return existing;
  }

  const insert = {
    anonymous_user_id: identity.anonymousUserId ?? null,
    user_id: identity.userId ?? null,
    display_name: profile.displayName ?? null,
    city: profile.city ?? null,
    email: profile.email ?? null,
  };
  const { data, error } = await supabase
    .from("concierge_threads")
    .insert(insert)
    .select("*")
    .single();
  if (error) throw new Error(`createThread: ${error.message}`);
  return data as ConciergeThread;
}

export async function getThreadMessages(
  supabase: SupabaseClient,
  threadId: string,
): Promise<ConciergeMessage[]> {
  const { data, error } = await supabase
    .from("concierge_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getThreadMessages: ${error.message}`);
  return (data ?? []) as ConciergeMessage[];
}
