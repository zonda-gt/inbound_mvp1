import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getAnonymousUserId, getCurrentLocation } from "@/lib/tracking";
import type { ConciergeMessage, ConciergeThread } from "@/lib/concierge-server";

export type { ConciergeMessage, ConciergeThread };

const IDENTITY_KEY = "concierge_identity";

export type ConciergeIdentity = {
  displayName: string;
  city: string | null;
  email: string | null;
};

export function getStoredIdentity(): ConciergeIdentity | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConciergeIdentity;
  } catch {
    return null;
  }
}

export function storeIdentity(identity: ConciergeIdentity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

// Best-effort city lookup via existing /api/reverse-geocode route. Returns null
// quickly if GPS unavailable, denied, or AMap fails — caller can let user type.
export async function detectCity(): Promise<string | null> {
  const loc = await getCurrentLocation(2500);
  if (!loc) return null;
  try {
    const res = await fetch("/api/reverse-geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: `${loc.lng},${loc.lat}` }),
    });
    if (!res.ok) return null;
    const data: { city?: string } = await res.json();
    return data.city ?? null;
  } catch {
    return null;
  }
}

export type ThreadResponse = {
  thread: ConciergeThread | null;
  messages: ConciergeMessage[];
};

export async function fetchThread(): Promise<ThreadResponse> {
  const anonymousUserId = getAnonymousUserId();
  if (!anonymousUserId) return { thread: null, messages: [] };
  const res = await fetch("/api/concierge/thread", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousUserId, create: false }),
  });
  if (!res.ok) return { thread: null, messages: [] };
  return (await res.json()) as ThreadResponse;
}

export async function sendMessage(
  content: string,
  identity: ConciergeIdentity | null,
): Promise<{ message: ConciergeMessage; thread: ConciergeThread } | null> {
  const anonymousUserId = getAnonymousUserId();
  if (!anonymousUserId) return null;
  const res = await fetch("/api/concierge/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymousUserId,
      content,
      displayName: identity?.displayName ?? null,
      city: identity?.city ?? null,
      email: identity?.email ?? null,
    }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function markRead(): Promise<void> {
  const anonymousUserId = getAnonymousUserId();
  if (!anonymousUserId) return;
  await fetch("/api/concierge/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousUserId }),
  }).catch(() => {});
}

// Subscribe to admin replies on a specific thread via Supabase Realtime.
// Returns an unsubscribe function.
export function subscribeToThread(
  threadId: string,
  onMessage: (message: ConciergeMessage) => void,
): () => void {
  const supabase = getSupabaseBrowserClient();
  const channel = supabase
    .channel(`concierge_thread_${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "concierge_messages",
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => onMessage(payload.new as ConciergeMessage),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
